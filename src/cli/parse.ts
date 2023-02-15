import { Connection } from "@solana/web3.js";
import { extract, getTokenMap } from "..";

(async () => {
  const signature =
    "2wi2SPbyFm9XbH1un1CcdfVTQcMoQxCreRvCikDDaVw49aQQvZoJPB9Sv2KX6NMTV2tctAtyF4EmvjGH8SMafq5a";
  const connection = new Connection(""); // Use your own RPC endpoint here.
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  const tokenMap = await getTokenMap();
  const result = await extract(
    signature,
    connection,
    tx,
    tokenMap,
    tx.blockTime
  );
  console.log(result);
})();
