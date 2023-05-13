import Decimal from "decimal.js";
import got from "got";
import { BN } from "@project-serum/anchor";
import { TokenInfo } from "@solana/spl-token-registry";

// Caches for Price API
const jupiterPrices: Map<string, any> = new Map();
const jupiterTTL: Map<string, number> = new Map();

// Use the Jupiter Pricing API to get the price of a token in USD.
export async function getPriceInUSDByMint(
  tokenMint: string
): Promise<Decimal | undefined> {
  try {
    let price = jupiterPrices.get(tokenMint);
    let ttl = jupiterTTL.get(tokenMint);

    // Cache for 60 seconds
    if (price && ttl && new Date().getTime() - ttl < 60 * 1000) {
      return new Decimal(price);
    }

    let payload = (await got
      .get(`https://price.jup.ag/v4/price?ids=${tokenMint}`)
      .json()) as any;

    if (payload.data[tokenMint]) {
      let price = payload.data[tokenMint].price;

      jupiterPrices.set(tokenMint, price);
      jupiterTTL.set(tokenMint, new Date().getTime());

      return new Decimal(price);
    }
  } catch (e) {
    console.log(`coin not found: ${tokenMint}`);
    return;
  }

  return;
}

export class DecimalUtil {
  public static fromBigInt(input: BigInt, shift = 0): Decimal {
    return new Decimal(input.toString()).div(new Decimal(10).pow(shift));
  }

  public static fromBN(input: BN, shift = 0): Decimal {
    return new Decimal(input.toString()).div(new Decimal(10).pow(shift));
  }
}

export async function getTokenMap(): Promise<Map<string, TokenInfo>> {
  const tokenMap = new Map();

  const tokenList = await got("https://cache.jup.ag/tokens").json<
    Array<TokenInfo>
  >();
  tokenList.forEach((item) => {
    tokenMap.set(item.address, item);
  });

  const unknownTokenList = await got(
    "https://cache.jup.ag/unknown-tokens"
  ).json<Array<TokenInfo>>();
  unknownTokenList.forEach((item) => {
    tokenMap.set(item.address, item);
  });

  return tokenMap;
}
