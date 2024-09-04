import { describe, expect, test } from "@jest/globals";
import { Connection } from "@solana/web3.js";
import { readFile } from "fs/promises";
import * as path from "path";
import { EventParser } from "../lib/event-parser";
import { InstructionParser } from "../lib/instruction-parser";
import { JUPITER_V6_PROGRAM_ID } from "../constants";

// Make sure JSON.stringify works with BigInt
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

let currentSignature = "";
const rpc = "https://api.mainnet-beta.solana.com";
const actualConnection = new Connection(process.env.RPC_URL || rpc);
const connection = new Proxy(actualConnection, {
  get: (target, prop, receiver) => {
    switch (prop) {
      case "_rpcRequest": {
        return async (...args: any[]) => {
          const [rpcMethod, restArgs] = args;

          if (rpcMethod === "getTransaction") {
            const signature = restArgs[0];
            const filePath = path.join(
              __dirname,
              `./snapshot/${currentSignature}/tx-${signature}.json`
            );
            return JSON.parse(await readFile(filePath, "utf8"));
          }

          if (rpcMethod === "getTransaction") {
            const account = restArgs[0];
            const filePath = path.join(
              __dirname,
              `./snapshot/${currentSignature}/account-${account}.json`
            );
            return JSON.parse(await readFile(filePath, "utf8"));
          }

          return target[prop](...args);
        };
      }
    }

    return Reflect.get(target, prop, receiver);
  },
});
const eventParser = new EventParser(connection);
const instructionParser = new InstructionParser(JUPITER_V6_PROGRAM_ID);

describe("instruction parser", () => {
  test("verify simple transaction", async () => {
    currentSignature =
      "2m6e4MBQ2wKiFhtc8d479C6SUKkqEiBzemwxSQVaSdr4zGHdoefxWz28u2rnCtUu7SfcgwWpEBDr3L5NZnEqffnv";
    await compare(currentSignature);
  });

  test("verify transaction with only openbook swap", async () => {
    currentSignature =
      "4riUkys7tZH6TSTgetiDoee6gG7HrzPqJniXoLm6CDnQ2cmkqdzVAtMjtbTYiVUz8vmhpE7tKkSJa2b2TrkPeuBr";
    await compare(currentSignature);
  });

  test("verify transaction with openbook swap", async () => {
    currentSignature =
      "2BppD7ZqzcCpJ4WbvSbm6AAH7ZS1dZxAgjwNWWCPxuk7ahxSwdRHVBKRLjtb4uQYJR1BfNxcehW6qcYTGKki1TgP";
    await compare(currentSignature);
  });

  test("verify transaction with stakedex swap ", async () => {
    currentSignature =
      "3LF4ABXfbETvFbQ7nr7WU8pZvQ3H4gFBRZnLb1gJMSKzHZZNMXbJA4VUsrsAMa9cgBJgJDv7aeNnbRDC39C2oi1X";
    await compare(currentSignature);
  });

  test("verify transaction with multiple routing instructions", async () => {
    currentSignature =
      "5Rt3HkbvPRtQZ2FKxi8mAbsrTSLUQmb5SaphqD32pntbC3hgxZV9PayGL6pZGMSVXWBrrCAaw8uhDSR6R8J5bkgy";
    await compare(currentSignature);
  });

  test("verify transaction with fee on transfer token", async () => {
    currentSignature =
      "GCeRpjvfNXZB6BJFQChjpKycdKpRwQGS1BSwUvLjVpJj6NgdzzQACAWt89ZEfEXjeRSqzhDX8CHtzpMUnfJ7VMJ";
    await compare(currentSignature);
  });

  test("verify transaction with jupiter route as inner instruction", async () => {
    currentSignature =
      "5SnGKXqNQ6zYGfNHQwHWwRtbxnYHUHLbANXgpvCLuXD1LA5paStRBcuXwu2T5eM9xsVWFQTzeUNwPWx6UAQhUb2t";
    await compare(currentSignature);
  });

    test("transaction with extra 'createTokenAccount' instruction", async () => {
        currentSignature =
            "5SPdWfQrAf8xky2CU9nycbc7MYEcJvmuKYwG2vUJ5BEfzSFK38RTvkqMHA5TuZV5fpaw65LoKVfGfKWmVTi71DHr";
        await compare(currentSignature);
    });
});

async function compare(signature: string) {
  const tx = await connection.getParsedTransaction(signature);
  const routeInfoList = eventParser.getRouteInfoList(tx);
  for (const [index, routeInfo] of routeInfoList.entries()) {
    const parsedEvents = await eventParser.getParsedEvents(tx, routeInfo);
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
    const filePath = path.join(
      __dirname,
      `./snapshot/${signature}/swap-result-${index}.json`
    );
    const result = JSON.parse(await readFile(filePath, "utf8"));

    // Hack to make sure that BigInt can compare in String format
    expect(JSON.parse(JSON.stringify(swapResult))).toEqual(result);
  }
}
