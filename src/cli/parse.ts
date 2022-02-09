import { Connection, PartiallyDecodedInstruction } from "@solana/web3.js";
import { InstructionParser } from "..";

(async () => {
  const signature =
    "3SoxaZFAiYL7WPfUpgMZ4czZcKxdft11hEeyEVsie5gcFuPTPDJU99QUt8ayj4mPPUAFnwecr5KKJADqGCBwVjJB";
  const connection = new Connection("https://ssc-dao.genesysgo.net");
  const tx = await connection.getParsedConfirmedTransaction(signature);

  // The third instruction of the above tx signature is a Jupiter swap instruction.
  const ix = tx.transaction.message
    .instructions[2] as PartiallyDecodedInstruction;

  const parser = new InstructionParser();
  const { source, destination } = parser.getSenderAndReceiverTokenAccounts(
    tx.transaction.message.accountKeys,
    ix
  );

  console.log({
    source: source.toBase58(),
    destination: destination.toBase58(),
  });
})();
