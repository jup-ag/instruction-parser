import { Connection } from '@solana/web3.js';
import { extract } from '../dist/index.js';
// import { extract } from '../src/index.js';

async function main() {
  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const transaction = await connection.getParsedTransaction(
    '3tD3xPDEFcRhfMKp1VJsFzFZGxQTbjpHgtPrzyL1h9dS1spb3YfZbx5TyaW617RQXSsrS3PRuKBvR5MMQn6T3N6f',
    {
      maxSupportedTransactionVersion: 0,
    }
  );
  console.log(transaction);
  const extracted = extract(
    '3tD3xPDEFcRhfMKp1VJsFzFZGxQTbjpHgtPrzyL1h9dS1spb3YfZbx5TyaW617RQXSsrS3PRuKBvR5MMQn6T3N6f',
    transaction
  );
  console.log(extracted);
}

main();
