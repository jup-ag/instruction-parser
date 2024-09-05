import { Connection } from "@solana/web3.js";
import { Command } from "commander";
import { extract } from ".";
import { JUPITER_V6_PROGRAM_ID } from "./constants";
import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { EventParser } from "./lib/event-parser";
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

    const result = await extract(signature, connection, tx, tx.blockTime);
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

      try {
        await extract(signature.signature, connection, tx, tx.blockTime);
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

    const eventsParser = new EventParser(connection);
    const instructionParser = new InstructionParser(JUPITER_V6_PROGRAM_ID);
    const routeInfoList = eventsParser.getRouteInfoList(tx);
    for (const [index, routeInfo] of routeInfoList.entries()) {
      const parsedEvents = await eventsParser.getParsedEvents(tx, routeInfo);
      const [initialPositions, finalPositions] =
        instructionParser.getInitialAndFinalSwapPositions(routeInfo);
      const exactOutAmount = instructionParser.getExactOutAmount(routeInfo);
      const exactInAmount = instructionParser.getExactInAmount(routeInfo);
      const swapResult = {
        parsedEvents,
        initialPositions,
        finalPositions,
        exactOutAmount,
        exactInAmount,
      };
      await writeFile(
        path.join(directoryPath + `/swap-result-${index}.json`),
        JSON.stringify(swapResult),
        { flag: "w+" }
      );
    }
  });

program.parse();
