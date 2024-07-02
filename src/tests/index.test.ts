import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Connection } from "@solana/web3.js";
import Decimal from "decimal.js";
import * as utils from "../lib/utils";
import { extract } from "..";

const getPriceInUSDByMintSpy = jest.spyOn(utils, "getPriceInUSDByMint");

const getPriceInUSDByMintMockImpl = jest.fn((tokenMint) => {
  let price: number;

  if (tokenMint === "So11111111111111111111111111111111111111112") {
    price = 147.793702285;
  } else if (tokenMint === "AkVt31h8vgji5wF4nVbq1QmBV5wBoe8JdSoDTkDhQwEw") {
    price = 0.0012856699999999998;
  } else if (tokenMint === "vVe16q1aGVSnZtK8PCXFnsh45VW6HCVrJPKCBSbpump") {
    price = 0.00017610899999999998;
  }

  return Promise.resolve(new Decimal(price));
});

describe("instruction parser", () => {
  beforeEach(() => {
    getPriceInUSDByMintSpy.mockImplementation(getPriceInUSDByMintMockImpl);
  });

  test("extract should work", async () => {
    const connection = new Connection(
      "https://jupiter.rpcpool.com/73517088-76ac-463a-aca4-b95717cb46d2"
    );
    const signature =
      "2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv";

    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    const tokenMap = await utils.getTokenMap();

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

    const result = await extract(
      signature,
      connection,
      tx,
      tokenMap,
      tx.blockTime
    );

    expect(result.transferAuthority).toEqual(expected.transferAuthority);
    expect(result.lastAccount).toEqual(expected.lastAccount);
    expect(result.instruction).toEqual(expected.instruction);
    expect(result.owner).toEqual(expected.owner);
    expect(result.programId).toEqual(expected.programId);
    expect(result.signature).toEqual(expected.signature);
    expect(result.timestamp).toEqual(expected.timestamp);
    expect(result.legCount).toEqual(expected.legCount);
    expect(result.volumeInUSD).toEqual(expected.volumeInUSD);
    expect(result.inSymbol).toEqual(expected.inSymbol);
    expect(result.inAmount).toEqual(expected.inAmount);
    expect(result.inAmountInDecimal).toEqual(expected.inAmountInDecimal);
    expect(result.inAmountInUSD).toEqual(expected.inAmountInUSD);
    expect(result.inMint).toEqual(expected.inMint);
    expect(result.outSymbol).toEqual(expected.outSymbol);
    expect(result.outAmount).toEqual(expected.outAmount);
    expect(result.outAmountInDecimal).toEqual(expected.outAmountInDecimal);
    expect(result.outAmountInUSD).toEqual(expected.outAmountInUSD);
    expect(result.outMint).toEqual(expected.outMint);
    expect(result.exactOutAmount).toEqual(expected.exactOutAmount);
    expect(result.exactOutAmountInUSD).toEqual(expected.exactOutAmountInUSD);

    expect((result.swapData as any).length).toEqual(expected.swapData.length);
    (result.swapData as any).forEach((swap, index) => {
      expect(swap.amm).toEqual(expected.swapData[index].amm);
      expect(swap.inSymbol).toEqual(expected.swapData[index].inSymbol);
      expect(swap.inMint).toEqual(expected.swapData[index].inMint);
      expect(swap.inAmount).toEqual(expected.swapData[index].inAmount);
      expect(swap.inAmountInDecimal).toEqual(
        expected.swapData[index].inAmountInDecimal
      );
      expect(Number(swap.inAmountInUSD)).toEqual(
        Number(expected.swapData[index].inAmountInUSD)
      );
      expect(swap.outSymbol).toEqual(expected.swapData[index].outSymbol);
      expect(swap.outMint).toEqual(expected.swapData[index].outMint);
      expect(swap.outAmount).toEqual(expected.swapData[index].outAmount);
      expect(swap.outAmountInDecimal).toEqual(
        expected.swapData[index].outAmountInDecimal
      );
      expect(Number(swap.outAmountInUSD)).toBeCloseTo(
        Number(expected.swapData[index].outAmountInUSD)
      );
    });

    expect(result.feeTokenPubkey).toEqual(expected.feeTokenPubkey);
    expect(result.feeOwner).toEqual(expected.feeOwner);
    expect(result.feeSymbol).toEqual(expected.feeSymbol);
    expect(result.feeAmount).toEqual(expected.feeAmount);
    expect(result.feeAmountInDecimal).toEqual(expected.feeAmountInDecimal);
    expect(result.feeAmountInUSD).toEqual(expected.feeAmountInUSD);
    expect(result.feeMint).toEqual(expected.feeMint);
  }, 200000);
});
