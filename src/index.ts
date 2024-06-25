import { BN, Event, Program, Provider } from "@coral-xyz/anchor";
import { unpackAccount, unpackMint } from "@solana/spl-token";
import { TokenInfo } from "@solana/spl-token-registry";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { InstructionParser } from "./lib/instruction-parser";
import { DecimalUtil, getPriceInUSDByMint } from "./lib/utils";
import { getEvents } from "./lib/get-events";
import { AMM_TYPES, JUPITER_V6_PROGRAM_ID } from "./constants";
import { FeeEvent, ParsedFeeEvent, ParsedSwapEvent, SwapEvent, TransactionWithMeta } from "./types";
import { IDL, Jupiter } from "./idl/jupiter";

export { getTokenMap } from "./lib/utils";
export { TransactionWithMeta };

export const program = new Program<Jupiter>(
  IDL,
  JUPITER_V6_PROGRAM_ID,
  {} as Provider
);

type AccountInfoMap = Map<string, AccountInfo<Buffer>>;

export type SwapAttributes = {
  owner: string;
  transferAuthority: string;
  programId: string;
  signature: string;
  timestamp: Date;
  legCount: number;
  volumeInUSD: number;
  inSymbol: string;
  inAmount: BigInt;
  inAmountInDecimal?: number;
  inAmountInUSD: number;
  inMint: string;
  outSymbol: string;
  outAmount: BigInt;
  outAmountInDecimal?: number;
  outAmountInUSD: number;
  outMint: string;
  instruction: string;
  exactInAmount: BigInt;
  exactInAmountInUSD: number;
  exactOutAmount: BigInt;
  exactOutAmountInUSD: number;
  swapData: JSON;
  feeTokenPubkey?: string;
  feeOwner?: string;
  feeSymbol?: string;
  feeAmount?: BigInt;
  feeAmountInDecimal?: number;
  feeAmountInUSD?: number;
  feeMint?: string;
  tokenLedger?: string;
  lastAccount: string; // This can be a tracking account since we don't have a way to know we just log it the last account.
};

const reduceEventData = <T>(events: Event[], name: string) =>
  events.reduce((acc, event) => {
    if (event.name === name) {
      acc.push(event.data as T);
    }
    return acc;
  }, new Array<T>());

export async function extract(
  signature: string,
  connection: Connection,
  tx: TransactionWithMeta,
  tokenMap: Map<string, TokenInfo>,
  blockTime?: number
): Promise<SwapAttributes | undefined> {
  const programId = JUPITER_V6_PROGRAM_ID;
  const accountInfosMap: AccountInfoMap = new Map();

  const logMessages = tx.meta.logMessages;
  if (!logMessages) {
    throw new Error("Missing log messages...");
  }

  const parser = new InstructionParser(programId);
  const events = getEvents(program, tx);
  const parsedEvents = await parser.getParsedEvents(tx, connection)

  const swapEvents = reduceEventData<ParsedSwapEvent>(parsedEvents, "ParsedSwapEvent");
  const feeEvent = reduceEventData<FeeEvent>(events, "FeeEvent")[0];

  if (swapEvents.length === 0) {
    // Not a swap event, for example: https://solscan.io/tx/5ZSozCHmAFmANaqyjRj614zxQY8HDXKyfAs2aAVjZaadS4DbDwVq8cTbxmM5m5VzDcfhysTSqZgKGV1j2A2Hqz1V
    return;
  }

  const accountsToBeFetched = new Array<PublicKey>();
  swapEvents.forEach((swapEvent) => {
    accountsToBeFetched.push(swapEvent.inputMint);
    accountsToBeFetched.push(swapEvent.outputMint);
  });

  if (feeEvent) {
    accountsToBeFetched.push(feeEvent.account);
  }
  const accountInfos = await connection.getMultipleAccountsInfo(
    accountsToBeFetched
  );
  accountsToBeFetched.forEach((account, index) => {
    accountInfosMap.set(account.toBase58(), accountInfos[index]);
  });

  const swapData = await parseSwapEvents(tokenMap, accountInfosMap, swapEvents);
  const instructions = parser.getInstructions(tx);
  const [initialPositions, finalPositions] =
    parser.getInitialAndFinalSwapPositions(instructions);

  const inSymbol = swapData[initialPositions[0]].inSymbol;
  const inMint = swapData[initialPositions[0]].inMint;
  const inSwapData = swapData.filter(
    (swap, index) => initialPositions.includes(index) && swap.inMint === inMint
  );
  const inAmount = inSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.inAmount);
  }, BigInt(0));
  const inAmountInDecimal = inSwapData.reduce((acc, curr) => {
    return acc.add(curr.inAmountInDecimal ?? 0);
  }, new Decimal(0));
  const inAmountInUSD = inSwapData.reduce((acc, curr) => {
    return acc.add(curr.inAmountInUSD ?? 0);
  }, new Decimal(0));

  const outSymbol = swapData[finalPositions[0]].outSymbol;
  const outMint = swapData[finalPositions[0]].outMint;
  const outSwapData = swapData.filter(
    (swap, index) => finalPositions.includes(index) && swap.outMint === outMint
  );
  const outAmount = outSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.outAmount);
  }, BigInt(0));
  const outAmountInDecimal = outSwapData.reduce((acc, curr) => {
    return acc.add(curr.outAmountInDecimal ?? 0);
  }, new Decimal(0));
  const outAmountInUSD = outSwapData.reduce((acc, curr) => {
    return acc.add(curr.outAmountInUSD ?? 0);
  }, new Decimal(0));

  const volumeInUSD =
    outAmountInUSD && inAmountInUSD
      ? Decimal.min(outAmountInUSD, inAmountInUSD)
      : outAmountInUSD ?? inAmountInUSD;

  const swap = {} as SwapAttributes;

  const [instructionName, transferAuthority, lastAccount] =
    parser.getInstructionNameAndTransferAuthorityAndLastAccount(instructions);

  swap.transferAuthority = transferAuthority;
  swap.lastAccount = lastAccount;
  swap.instruction = instructionName;
  swap.owner = tx.transaction.message.accountKeys[0].pubkey.toBase58();
  swap.programId = programId.toBase58();
  swap.signature = signature;
  swap.timestamp = new Date(new Date((blockTime ?? 0) * 1000).toISOString());
  swap.legCount = swapEvents.length;
  swap.volumeInUSD = volumeInUSD.toNumber();

  swap.inSymbol = inSymbol;
  swap.inAmount = inAmount;
  swap.inAmountInDecimal = inAmountInDecimal.toNumber();
  swap.inAmountInUSD = inAmountInUSD.toNumber();
  swap.inMint = inMint;

  swap.outSymbol = outSymbol;
  swap.outAmount = outAmount;
  swap.outAmountInDecimal = outAmountInDecimal.toNumber();
  swap.outAmountInUSD = outAmountInUSD.toNumber();
  swap.outMint = outMint;

  const exactOutAmount = parser.getExactOutAmount(
    tx.transaction.message.instructions
  );
  if (exactOutAmount) {
    swap.exactOutAmount = BigInt(exactOutAmount);

    if (outAmountInUSD) {
      swap.exactOutAmountInUSD = new Decimal(exactOutAmount)
        .div(outAmount.toString())
        .mul(outAmountInUSD)
        .toNumber();
    }
  }

  const exactInAmount = parser.getExactInAmount(
    tx.transaction.message.instructions
  );
  if (exactInAmount) {
    swap.exactInAmount = BigInt(exactInAmount);

    if (inAmountInUSD) {
      swap.exactInAmountInUSD = new Decimal(exactInAmount)
        .div(inAmount.toString())
        .mul(inAmountInUSD)
        .toNumber();
    }
  }

  swap.swapData = JSON.parse(JSON.stringify(swapData));

  if (feeEvent) {
    const { symbol, mint, amount, amountInDecimal, amountInUSD } =
      await extractVolume(
        tokenMap,
        accountInfosMap,
        feeEvent.mint,
        feeEvent.amount
      );
    swap.feeTokenPubkey = feeEvent.account.toBase58();
    swap.feeOwner = extractTokenAccountOwner(
      accountInfosMap,
      feeEvent.account
    )?.toBase58();
    swap.feeSymbol = symbol;
    swap.feeAmount = BigInt(amount);
    swap.feeAmountInDecimal = amountInDecimal?.toNumber();
    swap.feeAmountInUSD = amountInUSD?.toNumber();
    swap.feeMint = mint;
  }

  return swap;
}

async function parseSwapEvents(
  tokenMap: Map<string, TokenInfo>,
  accountInfosMap: AccountInfoMap,
  swapEvents: SwapEvent[]
) {
  const swapData = await Promise.all(
    swapEvents.map((swapEvent) =>
      extractSwapData(tokenMap, accountInfosMap, swapEvent)
    )
  );

  return swapData;
}

async function extractSwapData(
  tokenMap: Map<string, TokenInfo>,
  accountInfosMap: AccountInfoMap,
  swapEvent: SwapEvent
) {
  const amm = AMM_TYPES[swapEvent.amm.toBase58()];

  const {
    symbol: inSymbol,
    mint: inMint,
    amount: inAmount,
    amountInDecimal: inAmountInDecimal,
    amountInUSD: inAmountInUSD,
  } = await extractVolume(
    tokenMap,
    accountInfosMap,
    swapEvent.inputMint,
    swapEvent.inputAmount
  );
  const {
    symbol: outSymbol,
    mint: outMint,
    amount: outAmount,
    amountInDecimal: outAmountInDecimal,
    amountInUSD: outAmountInUSD,
  } = await extractVolume(
    tokenMap,
    accountInfosMap,
    swapEvent.outputMint,
    swapEvent.outputAmount
  );

  return {
    amm,
    inSymbol,
    inMint,
    inAmount,
    inAmountInDecimal,
    inAmountInUSD,
    outSymbol,
    outMint,
    outAmount,
    outAmountInDecimal,
    outAmountInUSD,
  };
}

async function extractVolume(
  tokenMap: Map<string, TokenInfo>,
  accountInfosMap: AccountInfoMap,
  mint: PublicKey,
  amount: BN
) {
  const token = tokenMap.get(mint.toBase58());
  const tokenPriceInUSD = await getPriceInUSDByMint(mint.toBase58());
  const tokenDecimals = extractMintDecimals(accountInfosMap, mint);
  const symbol = token?.symbol;
  const amountInDecimal = DecimalUtil.fromBN(amount, tokenDecimals);
  const amountInUSD = tokenPriceInUSD
    ? amountInDecimal.mul(tokenPriceInUSD)
    : undefined;

  return {
    token,
    symbol,
    mint: mint.toBase58(),
    amount: amount.toString(),
    amountInDecimal,
    amountInUSD,
  };
}

function extractTokenAccountOwner(
  accountInfosMap: AccountInfoMap,
  account: PublicKey
) {
  const accountData = accountInfosMap.get(account.toBase58());

  if (accountData) {
    const accountInfo = unpackAccount(account, accountData, accountData.owner);
    return accountInfo.owner;
  }

  return;
}

function extractMintDecimals(accountInfosMap: AccountInfoMap, mint: PublicKey) {
  const mintData = accountInfosMap.get(mint.toBase58());

  if (mintData) {
    const mintInfo = unpackMint(mint, mintData, mintData.owner);
    return mintInfo.decimals;
  }

  return;
}
