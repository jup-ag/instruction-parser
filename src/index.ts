import { BN, Event, IdlTypes } from "@project-serum/anchor";
import { MintLayout } from "@solana/spl-token";
import { TokenInfo } from "@solana/spl-token-registry";
import {
  AccountInfo,
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import Decimal from "decimal.js";
import got from "got";
import { Jupiter } from "./idl/jupiter";
import { EventExtractor } from "./lib/event-extractor";
import { InstructionParser } from "./lib/instruction-parser";
import { DecimalUtil, getPriceInUSDByMint } from "./lib/utils";

type AccountInfoMap = Map<string, AccountInfo<Buffer>>;

export const JUPITER_V4_PROGRAM_ID = new PublicKey(
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
);

export const AMM_TYPES = {
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca",
  MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky: "Mercurial",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium",
  SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ: "Saber",
  PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP: "Penguin",
  AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6: "Aldrin",
  CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4: "Aldrin v2",
  SSwpMgqNDsyV7mAgN9ady4bDVu5ySjmmXejXvy2vLt1: "Step",
  CTMAxxk34HjKWxQ3QLZK1HpaLXmBveao3ESePXbiyfzh: "Cropper",
  SCHAtsf8mbjyjiv4LkhLKutTf6JnZAbdJKFkXQNMFHZ: "Sencha",
  CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR: "Crema",
  EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S: "Lifinity",
  SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr: "Saros",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Whirlpool",
  cysPXAjehMpVKUapzbMCCnpFxUFFryEWEaLgnb9NrR8: "Cykura",
  MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD: "Marinade",
  Dooar9JkhdZ7J3LHN3A7YCuoGRUggXhQaG4kijfLGU2j: "Stepn",
  Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB: "Meteora",
  HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt: "Invariant",
  "7WduLbRfYhTJktjLw5FDEyrqoEv61aTTCuGAetgLjzN5": "GooseFX",
  DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB: "Saber Decimal Wrapper",
  D3BBjqUdCYuP18fNvvMbPAZ8DpcRi4io2EsYHQawJDag: "Balansol",
  dp2waEWSBy5yKmq65ergoU3G6qRLmqa6K7We4rZSKph: "Dradex",
  "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c": "Lifinity v2",
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: "Raydium CLMM",
  srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: "Openbook",
  "9tKE7Mbmj4mxDjWatikzGAtkoWosiiZX9y6J4Hfm2R8H": "Marco Polo",
};

export type TransactionAttributes = {
  owner: string;
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
};

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

export async function extract(
  signature: string,
  connection: Connection,
  tx: ParsedTransactionWithMeta,
  tokenMap: Map<string, TokenInfo>,
  blockTime?: number
): Promise<TransactionAttributes> {
  const programId = JUPITER_V4_PROGRAM_ID;
  const accountInfosMap: AccountInfoMap = new Map();

  const logMessages = tx.meta.logMessages;
  if (!logMessages) {
    throw new Error("Missing log messages...");
  }

  const extractor = new EventExtractor(programId);
  const parser = new InstructionParser(programId);
  const events = extractor.getEvents(logMessages);

  const swapEvents = events.filter((event) => event.name === "Swap");
  const feeEvent = events.filter((event) => event.name === "Fee")[0];

  if (swapEvents.length === 0) {
    // Not a swap event, for example: https://solscan.io/tx/5ZSozCHmAFmANaqyjRj614zxQY8HDXKyfAs2aAVjZaadS4DbDwVq8cTbxmM5m5VzDcfhysTSqZgKGV1j2A2Hqz1V
    return;
  }

  const accountsToBeFetched = [];
  swapEvents.forEach((event) => {
    accountsToBeFetched.push(event.data.inputMint);
    accountsToBeFetched.push(event.data.outputMint);
  });

  if (feeEvent) {
    accountsToBeFetched.push(feeEvent.data.account);
  }
  const accountInfos = await connection.getMultipleAccountsInfo(
    accountsToBeFetched
  );
  accountsToBeFetched.forEach((account, index) => {
    accountInfosMap.set(account.toBase58(), accountInfos[index]);
  });

  const swapData = await parseSwapEvents(
    tokenMap,
    accountInfosMap,
    swapEvents as any
  );

  const [initialPositions, finalPositions] =
    parser.getInitialAndFinalSwapPositions(parser.getInstructions(tx));

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

  const newTx: TransactionAttributes = {} as TransactionAttributes;

  newTx.owner = tx.transaction.message.accountKeys[0].pubkey.toBase58();
  newTx.programId = programId.toBase58();
  newTx.signature = signature;
  newTx.timestamp = new Date(new Date((blockTime ?? 0) * 1000).toISOString());
  newTx.legCount = swapEvents.length;
  newTx.volumeInUSD = volumeInUSD.toNumber();

  newTx.inSymbol = inSymbol;
  newTx.inAmount = inAmount;
  newTx.inAmountInDecimal = inAmountInDecimal.toNumber();
  newTx.inAmountInUSD = inAmountInUSD.toNumber();
  newTx.inMint = inMint;

  newTx.outSymbol = outSymbol;
  newTx.outAmount = outAmount;
  newTx.outAmountInDecimal = outAmountInDecimal.toNumber();
  newTx.outAmountInUSD = outAmountInUSD.toNumber();
  newTx.outMint = outMint;

  const exactOutAmount = parser.getExactOutAmount(
    tx.transaction.message.instructions as any
  );
  if (exactOutAmount) {
    newTx.exactOutAmount = BigInt(exactOutAmount);

    if (outAmountInUSD) {
      newTx.exactOutAmountInUSD = new Decimal(exactOutAmount)
        .div(outAmount.toString())
        .mul(outAmountInUSD)
        .toNumber();
    }
  }

  newTx.swapData = JSON.parse(JSON.stringify(swapData));

  if (feeEvent) {
    const { symbol, mint, amount, amountInDecimal, amountInUSD } =
      await this.extractVolume(
        tokenMap,
        accountInfosMap,
        feeEvent.data.mint as any,
        feeEvent.data.amount as any
      );
    newTx.feeTokenPubkey = (feeEvent.data.account as any).toBase58();
    newTx.feeOwner = this.extractTokenAccountOwner(
      accountInfosMap,
      feeEvent.data.account as any
    )?.toBase58();
    newTx.feeSymbol = symbol;
    newTx.feeAmount = BigInt(amount);
    newTx.feeAmountInDecimal = amountInDecimal?.toNumber();
    newTx.feeAmountInUSD = amountInUSD?.toNumber();
    newTx.feeMint = mint;
  }

  return newTx;
}

async function parseSwapEvents(
  tokenMap: Map<string, TokenInfo>,
  accountInfosMap: AccountInfoMap,
  events: Event<Jupiter["events"][0], IdlTypes<Jupiter>>[]
) {
  const swapData = await Promise.all(
    events.map(async (event) => {
      return await extractSwapData(tokenMap, accountInfosMap, event);
    })
  );

  return swapData;
}

async function extractSwapData(
  tokenMap: Map<string, TokenInfo>,
  accountInfosMap: AccountInfoMap,
  event: Event<Jupiter["events"][0], IdlTypes<Jupiter>>
) {
  const amm = AMM_TYPES[event.data.amm.toBase58()];

  const {
    symbol: inSymbol,
    mint: inMint,
    amount: inAmount,
    amountInDecimal: inAmountInDecimal,
    amountInUSD: inAmountInUSD,
  } = await extractVolume(
    tokenMap,
    accountInfosMap,
    event.data.inputMint,
    event.data.inputAmount
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
    event.data.outputMint,
    event.data.outputAmount
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

function extractMintDecimals(accountInfosMap: AccountInfoMap, mint: PublicKey) {
  const mintData = accountInfosMap.get(mint.toBase58());

  if (
    mintData &&
    mintData.owner.equals(
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    ) &&
    mintData.data.length === 82
  ) {
    const mintInfo = MintLayout.decode(mintData.data);
    return mintInfo.decimals;
  }

  return;
}
