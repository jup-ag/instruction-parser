import { Connection } from "@solana/web3.js";
import { Command } from "commander";
import { extract } from ".";

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

program.parse();
