import { Connection } from "@solana/web3.js";
import { Command } from "commander";
import { getTokenMap } from "./lib/utils";
import { extract } from ".";
import { JUPITER_V6_PROGRAM_ID } from "./constants";
import * as fs from "fs";
import * as path from "path";

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
  .command("save-tx")
  .requiredOption("-s, --signature <signature>")
  .requiredOption("-r, --rpc <rpc>")
  .addHelpText("beforeAll", "Save transaction for mock testing")
  .action(async ({ signature, rpc }) => {
    const connection = new Connection(rpc); // Use your own RPC endpoint here.
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx.meta.err) {
      console.log("Failed transaction", tx.meta.err);
    }

    const filePath = path.join(
      __dirname,
      `./tests/transactions/${signature}.json`
    );

    fs.writeFile(filePath, JSON.stringify(tx), { flag: "w+" }, (writeErr) => {
      if (writeErr) throw writeErr;
      console.log("Content added to file!");
    });
  });

program.parse();
