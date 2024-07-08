import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import * as utils from "../lib/utils";
import { extract, SwapAttributes } from "..";
import { serialiseTransaction, serializeResult } from "./helpers/serialize";
import basicTransaction from "./transactions/2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv.json";
import onlyOpenBookTransaction from "./transactions/4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr.json";
import openbookTrasaction from "./transactions/2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP.json";
import stakedexTransaction from "./transactions/3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X.json";

import basicTransactionResult from "./results/2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv.json";
import onlyOpenBookTransactioResult from "./results/4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr.json";
import openbookTrasactionResult from "./results/2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP.json";
import stakedexTransactionResult from "./results/3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X.json";

const rpc = "https://jupiter.rpcpool.com/73517088-76ac-463a-aca4-b95717cb46d2";
const connection = new Connection(rpc);

describe("instruction parser", () => {
  test("verify simple transaction", async () => {
    const signature =
      "2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv";
    const tx = serialiseTransaction(basicTransaction);
    const expected = serializeResult(basicTransactionResult);
    const result = await getResult(signature, tx);
    compareSwapAttrubutes(result, expected);
  }, 200000);

  test("verify transaction with only openbook swap", async () => {
    const signature =
      "4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr";
    const tx = serialiseTransaction(onlyOpenBookTransaction);
    const expected = serializeResult(onlyOpenBookTransactioResult);
    const result = await getResult(signature, tx);
    compareSwapAttrubutes(result, expected);
  }, 200000);

  test("verify transaction with openbook swap", async () => {
    const signature =
      "2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP";
    const tx = serialiseTransaction(openbookTrasaction);
    const expected = serializeResult(openbookTrasactionResult);
    const result = await getResult(signature, tx);
    compareSwapAttrubutes(result, expected);
  }, 200000);

  test("verify transaction with stakedex swap ", async () => {
    const signature =
      "3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X";
    const tx = serialiseTransaction(stakedexTransaction);
    const expected = serializeResult(stakedexTransactionResult);
    const result = await getResult(signature, tx);
    compareSwapAttrubutes(result, expected);
  }, 200000);
});

function compareSwapAttrubutes(
  result: SwapAttributes,
  expected: SwapAttributes
) {
  expect((result.swapData as any).length).toEqual(
    (expected.swapData as any).length
  );
  (result.swapData as any).forEach((swap, index) => {
    expect(swap.amm).toEqual(expected.swapData[index].amm);
    expect(swap.inMint).toEqual(expected.swapData[index].inMint);
    expect(swap.inAmount).toEqual(expected.swapData[index].inAmount);
    expect(swap.outMint).toEqual(expected.swapData[index].outMint);
    expect(swap.outAmount).toEqual(expected.swapData[index].outAmount);
  });
  expect(result.feeTokenPubkey).toEqual(expected.feeTokenPubkey);
  expect(result.feeSymbol).toEqual(expected.feeSymbol);
  expect(result.feeAmount).toEqual(expected.feeAmount);
  expect(result.feeMint).toEqual(expected.feeMint);
}

async function getResult(signature: string, tx: ParsedTransactionWithMeta) {
  const tokenMap = await utils.getTokenMap();
  const result = await extract(
    signature,
    connection,
    tx,
    tokenMap,
    tx.blockTime
  );
  return result;
}
