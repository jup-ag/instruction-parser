import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Connection } from "@solana/web3.js";
import * as utils from "../lib/utils";
import { extract } from "..";
import { serialiseTransaction } from "./helpers/serialize";
import basicTransaction from "./mockTransactions/basicTransaction.json";
import onlyOpenBookTransaction from "./mockTransactions/onlyOpenBookTransaction.json";
import openbookTrasaction from "./mockTransactions/openbookTransaction.json";
import stakedexTransaction from "./mockTransactions/stakedexTransaction.json"

const rpc = "https://jupiter.rpcpool.com/73517088-76ac-463a-aca4-b95717cb46d2";
const connection = new Connection(rpc);

describe("instruction parser", () => {
  test("basic transaction parsing should work", async () => {
    const signature =
      "2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv";
    const tx = serialiseTransaction(basicTransaction);
    const expected = {
      transferAuthority: "6oHypdkuE3n41w3XBidags663HQRiXBN8W4qjxyUz4YS",
      lastAccount: "J56q6nX15WHRLJcsGB6s1bjaiywrn8DqLLvLccz61cYx",
      instruction: "sharedAccountsRoute",
      owner: "6oHypdkuE3n41w3XBidags663HQRiXBN8W4qjxyUz4YS",
      programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      signature:
        "2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv",
      timestamp: new Date("2024-06-25T03:42:01.000Z"),
      legCount: 2,
      volumeInUSD: 0.46442707785408627,
      inSymbol: "SUPERSTONK",
      inAmount: BigInt("5878070878"),
      inAmountInDecimal: 5878.070878,
      inAmountInUSD: 1.035181184253702,
      inMint: "vVe16q1aGVSnZtK8PCXFnsh45VW6HCVrJPKCBSbpump",
      outSymbol: "SOL",
      outAmount: BigInt("3142401"),
      outAmountInDecimal: 0.003142401,
      outAmountInUSD: 0.46442707785408627,
      outMint: "So11111111111111111111111111111111111111112",
      exactOutAmount: BigInt("3116317"),
      exactOutAmountInUSD: 0.4605720269236843,
      swapData: [
        {
          amm: "Meteora",
          inSymbol: "SUPERSTONK",
          inMint: "vVe16q1aGVSnZtK8PCXFnsh45VW6HCVrJPKCBSbpump",
          inAmount: "5878070878",
          inAmountInDecimal: "5878.070878",
          inAmountInUSD: "1.035181184253702",
          outSymbol: "WSB",
          outMint: "AkVt31h8vgji5wF4nVbq1QmBV5wBoe8JdSoDTkDhQwEw",
          outAmount: "398451555",
          outAmountInDecimal: "398.451555",
          outAmountInUSD: "0.51227721071685",
        },
        {
          amm: "Raydium",
          inSymbol: "WSB",
          inMint: "AkVt31h8vgji5wF4nVbq1QmBV5wBoe8JdSoDTkDhQwEw",
          inAmount: "398451555",
          inAmountInDecimal: "398.451555",
          inAmountInUSD: "0.51227721071685",
          outSymbol: "SOL",
          outMint: "So11111111111111111111111111111111111111112",
          outAmount: "3142401",
          outAmountInDecimal: "0.003142401",
          outAmountInUSD: "0.464427077854086285",
        },
      ],
      feeTokenPubkey: "EcDs7cZxDHnGtjBuL6E1QC5smfPaBVWbdTShCXyor6H3",
      feeOwner: "45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpye7Hp",
      feeSymbol: "SOL",
      feeAmount: BigInt("26710"),
      feeAmountInDecimal: 0.00002671,
      feeAmountInUSD: 0.00394756978803235,
      feeMint: "So11111111111111111111111111111111111111112",
    };

    const tokenMap = await utils.getTokenMap();
    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    expect((result.swapData as any).length).toEqual(expected.swapData.length);
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
  }, 200000);

  test(" only openbbook swap parsing should work", async () => {
    const signature =
      "4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr";
    const tx = serialiseTransaction(onlyOpenBookTransaction);
    const expected = {
      transferAuthority: "AgHKxMdBmnvKVNBiqQHuLUVyHRGj7xsjVNGxnkUQbDHX",
      lastAccount: "J56q6nX15WHRLJcsGB6s1bjaiywrn8DqLLvLccz61cYx",
      instruction: "sharedAccountsRoute",
      owner: "AgHKxMdBmnvKVNBiqQHuLUVyHRGj7xsjVNGxnkUQbDHX",
      programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      signature:
        "4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr",
      timestamp: new Date("2024-07-04T06:23:09.000Z"),
      legCount: 1,
      volumeInUSD: 8.090882,
      inSymbol: "SOL",
      inAmount: BigInt(60000000),
      inAmountInDecimal: 0.06,
      inAmountInUSD: 8.43317922372,
      inMint: "So11111111111111111111111111111111111111112",
      outSymbol: "USDC",
      outAmount: BigInt(8090882),
      outAmountInDecimal: 8.090882,
      outAmountInUSD: 8.090882,
      outMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      exactOutAmount: BigInt(8022110),
      exactOutAmountInUSD: 8.02211,
      swapData: [
        {
          amm: "Openbook",
          inSymbol: "SOL",
          inMint: "So11111111111111111111111111111111111111112",
          inAmount: "60000000",
          inAmountInDecimal: "0.06",
          inAmountInUSD: "8.43317922372",
          outSymbol: "USDC",
          outMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          outAmount: "8090882",
          outAmountInDecimal: "8.090882",
          outAmountInUSD: "8.090882",
        },
      ],
      feeTokenPubkey: "DB4KNmfTDs8XBjsqTfP2orBz297e5Uf7KtiGw39jRKPW",
      feeOwner: "45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpye7Hp",
      feeSymbol: "USDC",
      feeAmount: BigInt(68772),
      feeAmountInDecimal: 0.068772,
      feeAmountInUSD: 0.068772,
      feeMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    };

    const tokenMap = await utils.getTokenMap();
    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    expect((result.swapData as any).length).toEqual(expected.swapData.length);
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
  }, 200000);

  test("openbbook swap parsing should work", async () => {
    const signature =
      "2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP";
    const tx = serialiseTransaction(openbookTrasaction);
    const expected = {
      transferAuthority: '4qLQDSpCwGJSig3tDvkfUbgW1TJWgeABpr5BtR3r3vZo',
      lastAccount: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
      instruction: 'route',
      owner: '4qLQDSpCwGJSig3tDvkfUbgW1TJWgeABpr5BtR3r3vZo',
      programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
      signature: '2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP',
      timestamp: new Date("2024-07-04T19:32:16.000Z"),
      legCount: 3,
      volumeInUSD: 27.8201333126,
      inSymbol: 'SOL',
      inAmount: BigInt(200000000),
      inAmountInDecimal: 0.2,
      inAmountInUSD: 27.8201333126,
      inMint: 'So11111111111111111111111111111111111111112',
      outSymbol: 'SOL',
      outAmount: BigInt(200085236),
      outAmountInDecimal: 0.200085236,
      outAmountInUSD: 27.831989697015164,
      outMint: 'So11111111111111111111111111111111111111112',
      exactOutAmount: BigInt(200085243),
      exactOutAmountInUSD: 27.83199067071983,
      swapData: [
        {
          amm: 'Openbook',
          inSymbol: 'SOL',
          inMint: 'So11111111111111111111111111111111111111112',
          inAmount: '200000000',
          inAmountInDecimal: '0.2',
          inAmountInUSD: '27.8201333126',
          outSymbol: 'USDC',
          outMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          outAmount: '27086960',
          outAmountInDecimal: '27.08696',
          outAmountInUSD: '27.08696'
        },
        {
          amm: 'Raydium',
          inSymbol: 'USDC',
          inMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          inAmount: '27086960',
          inAmountInDecimal: '27.08696',
          inAmountInUSD: '27.08696',
          outSymbol: 'mSOL',
          outMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          outAmount: '166770422',
          outAmountInDecimal: '0.166770422',
          outAmountInUSD: '27.847257067755526674'
        },
        {
          amm: 'Raydium CLMM',
          inSymbol: 'mSOL',
          inMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          inAmount: '166770422',
          inAmountInDecimal: '0.166770422',
          inAmountInUSD: '27.847257067755526674',
          outSymbol: 'SOL',
          outMint: 'So11111111111111111111111111111111111111112',
          outAmount: '200085236',
          outAmountInDecimal: '0.200085236',
          outAmountInUSD: '27.831989697015163868'
        }
      ]
    }

    const tokenMap = await utils.getTokenMap();
    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    expect((result.swapData as any).length).toEqual(expected.swapData.length);
    (result.swapData as any).forEach((swap, index) => {
      expect(swap.amm).toEqual(expected.swapData[index].amm);
      expect(swap.inMint).toEqual(expected.swapData[index].inMint);
      expect(swap.inAmount).toEqual(expected.swapData[index].inAmount);
      expect(swap.outMint).toEqual(expected.swapData[index].outMint);
      expect(swap.outAmount).toEqual(expected.swapData[index].outAmount);
    });
  }, 200000);

  test("stakedex swap parsing should work", async () => {
    const signature =
      "3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X";
    const tx = serialiseTransaction(stakedexTransaction);
    const expected = {
      transferAuthority: 'J6SiqG6aWGWFxcXFd6c3xjrvbsX8PTYyYNY97dxceH4P',
      lastAccount: '3ZDBff7jeQaksmGvmkRix36rU159EBDjYiPThvV8QVZM',
      instruction: 'sharedAccountsRoute',
      owner: 'J6SiqG6aWGWFxcXFd6c3xjrvbsX8PTYyYNY97dxceH4P',
      programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
      signature: '3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X',
      timestamp: new Date("2024-06-28T14:05:46.000Z"),
      legCount: 3,
      volumeInUSD: 2930.9054744,
      inSymbol: 'rkSOL',
      inAmount: BigInt(20000000000),
      inAmountInDecimal: 20,
      inAmountInUSD: 2930.9054744,
      inMint: 'EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL',
      outSymbol: 'USDT',
      outAmount: BigInt(2994093354),
      outAmountInDecimal: 2994.093354,
      outAmountInUSD: 2994.90175920558,
      outMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      exactOutAmount: BigInt(2993471962),
      exactOutAmountInUSD: 2994.28019942974,
      swapData: [
        {
          amm: 'unstake.it',
          inSymbol: 'rkSOL',
          inMint: 'EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL',
          inAmount: '20000000000',
          inAmountInDecimal: '20',
          inAmountInUSD: '2930.9054744',
          outSymbol: 'mSOL',
          outMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          outAmount: '17398506594',
          outAmountInDecimal: '17.398506594',
          outAmountInUSD: '2919.3239007095305999'
        },
        {
          amm: 'Whirlpool',
          inSymbol: 'mSOL',
          inMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          inAmount: '17398506594',
          inAmountInDecimal: '17.398506594',
          inAmountInUSD: '2919.3239007095305999',
          outSymbol: 'SOL',
          outMint: 'So11111111111111111111111111111111111111112',
          outAmount: '20847655935',
          outAmountInDecimal: '20.847655935',
          outAmountInUSD: '2913.9755379668927595'
        },
        {
          amm: 'Lifinity v2',
          inSymbol: 'SOL',
          inMint: 'So11111111111111111111111111111111111111112',
          inAmount: '20847655935',
          inAmountInDecimal: '20.847655935',
          inAmountInUSD: '2913.9755379668927595',
          outSymbol: 'USDT',
          outMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
          outAmount: '2994093354',
          outAmountInDecimal: '2994.093354',
          outAmountInUSD: '2994.90175920558'
        }
      ]
    };

    const tokenMap = await utils.getTokenMap();
    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    expect((result.swapData as any).length).toEqual(expected.swapData.length);
    (result.swapData as any).forEach((swap, index) => {
      expect(swap.amm).toEqual(expected.swapData[index].amm);
      expect(swap.inMint).toEqual(expected.swapData[index].inMint);
      expect(swap.inAmount).toEqual(expected.swapData[index].inAmount);
      expect(swap.outMint).toEqual(expected.swapData[index].outMint);
      expect(swap.outAmount).toEqual(expected.swapData[index].outAmount);
    });
  }, 200000);
});
