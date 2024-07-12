import Decimal from "decimal.js";
import got from "got";
import { BN } from "@coral-xyz/anchor";
import { TokenInfo } from "@solana/spl-token-registry";
import { ParsedInstruction } from "@solana/web3.js";
import { PartialInstruction, SwapData } from "../types";
import {
  AMM_TYPES,
  SWAP_DIRECTION_ARGS,
  STACK_HEIGHT,
  TRANSFER_INSTRUCTION_TYPES,
} from "../constants";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

// Caches for Price API
const jupiterPrices: Map<string, any> = new Map();
const jupiterTTL: Map<string, number> = new Map();
// Cache for token list
const tokenInfoCache: Map<string, TokenInfo> = new Map();

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

export async function getTokenInfo(token: string) {
  if (tokenInfoCache.has(token)) {
    return tokenInfoCache.get(token);
  }
  const tokenInfo = await got(
    `https://tokens.jup.ag/token/${token}`
  ).json<TokenInfo>();
  tokenInfoCache.set(token, tokenInfo);
  return tokenInfo;
}

export function isSwapInstruction(
  instruction: ParsedInstruction | PartialInstruction
) {
  return (
    instruction.programId.toBase58() in AMM_TYPES &&
    (instruction as any).stackHeight === STACK_HEIGHT.SWAP
  );
}

export function isTransferInstruction(innerInstruction: ParsedInstruction) {
  if (
    innerInstruction.programId.equals(TOKEN_PROGRAM_ID) ||
    innerInstruction.programId.equals(TOKEN_2022_PROGRAM_ID)
  ) {
    const ixType = innerInstruction.parsed.type;
    const ixstackHeight = (innerInstruction as any).stackHeight;
    if (
      TRANSFER_INSTRUCTION_TYPES.has(ixType) &&
      ixstackHeight >= STACK_HEIGHT.TOKEN_TRANSFER // Greater than is added to handle cases where token transfers happen in deposit and withdraw functions
    )
      return ixType;
  }
  return null;
}

export function isFeeInstruction(
  innerInstruction: ParsedInstruction,
  feeAccount: string,
  destination: string
) {
  const ixType = innerInstruction.parsed.type;
  const stackHeight = (innerInstruction as any).stackHeight;
  return (
    (ixType === "transfer" || ixType === "transferChecked") &&
    stackHeight === STACK_HEIGHT.FEE &&
    feeAccount === destination
  );
}

export function getSwapDirection(amm: string, swapData: SwapData) {
  if (SWAP_DIRECTION_ARGS.SIDE.includes(amm))
    return !Object.values(swapData)[0]["side"]["bid"];

  if (SWAP_DIRECTION_ARGS.A_TO_B.includes(amm))
    return Object.values(swapData)[0]["aToB"];

  if (SWAP_DIRECTION_ARGS.X_TO_Y.includes(amm)) {
    return Object.values(swapData)[0]["xToY"];
  }

  if (SWAP_DIRECTION_ARGS.QUANTITY_IS_COLLATERAL.includes(amm)) {
    return Object.values(swapData)[0]["quantityIsCollateral"];
  }

  return true;
}

export function isRouting(name: string) {
  return (
    name === "route" ||
    name === "routeWithTokenLedger" ||
    name === "sharedAccountsRoute" ||
    name === "sharedAccountsRouteWithTokenLedger" ||
    name === "sharedAccountsExactOutRoute" ||
    name === "exactOutRoute"
  );
}
