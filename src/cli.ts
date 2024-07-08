import { Connection } from "@solana/web3.js";
import { Command } from "commander";
import { getTokenMap } from "./lib/utils";
import { extract } from ".";
import { JUPITER_V6_PROGRAM_ID } from "./constants";
import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { InstructionParser } from "./lib/instruction-parser";

// Make sure JSON.stringify works with BigInt
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

const program = new Command();
program
  .command("lookup-tx")
  .requiredOption("-s, --signature <signature>")
  .requiredOption("-r, --rpc <rpc>")
  .addHelpText(
    "beforeAll",
    "Look up a Jupiter v6 swap transaction and extract its information"
  )
  .action(async ({ signature, rpc }) => {
    const connection = new Connection(rpc); // Use your own RPC endpoint here.
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx.meta.err) {
      console.log("Failed transaction", tx.meta.err);
    }

    const tokenMap = await getTokenMap();
    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    console.log(result);
  });

program
  .command("test")
  .option("-r --limit <limit>", "limit of transactions", "500")
  .requiredOption("-r --rpc <rpc>")
  .addHelpText("beforeAll", "Test instruction parser")
  .action(async ({ limit, rpc }) => {
    const connection = new Connection(rpc);
    const signatures = await connection.getSignaturesForAddress(
      JUPITER_V6_PROGRAM_ID,
      {
        limit: parseInt(limit),
      }
    );

    for (const signature of signatures) {
      const tx = await connection.getParsedTransaction(signature.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (tx.meta.err) {
        continue;
      }

      const tokenMap = await getTokenMap();

      try {
        await extract(
          signature.signature,
          connection,
          tx,
          tokenMap,
          tx.blockTime
        );
        console.log("Transaction succesfully extracted: ", signature.signature);
      } catch (error) {
        console.log(
          "Error while extracting transaction: ",
          signature.signature,
          error
        );
      }
    }
  });

program
  .command("snapshot")
  .requiredOption("-s, --signature <signature>")
  .requiredOption("-r, --rpc <rpc>")
  .addHelpText("beforeAll", "Snapshot transaction for mock testing")
  .action(async ({ signature, rpc }) => {
    const directoryPath = path.join(__dirname, `./tests/snapshot/${signature}`);
    await mkdir(directoryPath, { recursive: true });

    const actualConnection = new Connection(rpc);
    const connection = new Proxy(actualConnection, {
      get: (target, prop, receiver) => {
        switch (prop) {
          case "_rpcRequest": {
            return async (...args: any[]) => {
              const [rpcMethod, restArgs] = args;
              if (rpcMethod === "getTransaction") {
                const result = await target[prop](...args);
                await writeFile(
                  path.join(directoryPath + `/tx-${signature}.json`),
                  JSON.stringify(result),
                  { flag: "w+" }
                );

                return result;
              }

              if (rpcMethod === "getAccountInfo") {
                const account = restArgs[0];
                const result = await target[prop](...args);
                await writeFile(
                  path.join(directoryPath + `/account-${account}.json`),
                  JSON.stringify(result),
                  { flag: "w+" }
                );

                return result;
              }

              return target[prop](...args);
            };
          }
        }

        return Reflect.get(target, prop, receiver);
      },
    });

    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    const parser = new InstructionParser(JUPITER_V6_PROGRAM_ID);
    const parsedEvents = await parser.getParsedEvents(tx, connection);
    await writeFile(
      path.join(directoryPath + `/parsed-events.json`),
      JSON.stringify(parsedEvents),
      { flag: "w+" }
    );
  });

program.parse();
