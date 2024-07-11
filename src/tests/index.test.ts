import { describe, expect, test } from "@jest/globals";
import { Connection } from "@solana/web3.js";
import { readFile } from "fs/promises";
import * as path from "path";
import { EventParser } from "../lib/event-parser";

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
    currentSignature = "4cWStqraSHpMd8ix4eNaRSa22BUubTtDxLaemkPRwpnydJWsZUxHi4xXuMnuZZX7KS2eZdguspZJL8bpQ34ZikfU";
    await compare(currentSignature);
  })
});

async function compare(signature: string) {
  const tx = await connection.getParsedTransaction(signature);
  const routeInfoList = eventParser.getRouteInfoList(tx);
  for (const [index, routeInfo] of routeInfoList.entries()) {
    const parsedEvents = await eventParser.getParsedEvents(tx, routeInfo);

    const filePath = path.join(
      __dirname,
      `./snapshot/${signature}/parsed-events-${index}.json`
    );
    const result = JSON.parse(await readFile(filePath, "utf8"));

    // Hack to make sure that BigInt can compare in String format
    expect(JSON.parse(JSON.stringify(parsedEvents))).toEqual(result);
  }
}
