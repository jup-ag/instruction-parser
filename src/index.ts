import { BN, Event, Program, Provider } from '@coral-xyz/anchor';
import { unpackAccount } from '@solana/spl-token';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { InstructionParser } from './lib/instruction-parser';
import { getEvents } from './lib/get-events';
import { AMM_TYPES, JUPITER_V6_PROGRAM_ID } from './constants';
import { FeeEvent, SwapEvent, TransactionWithMeta } from './types';
import { IDL, Jupiter } from './idl/jupiter';

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
  inAmount: BigInt;
  inMint: string;
  outAmount: BigInt;
  outMint: string;
  instruction: string;
  exactInAmount: BigInt;
  exactInAmountInUSD: number;
  exactOutAmount: BigInt;
  exactOutAmountInUSD: number;
  swapData: JSON;
  feeTokenPubkey?: string;
  feeOwner?: string;
  feeAmount?: BigInt;
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

export function extract(
  signature: string,
  tx: TransactionWithMeta
): SwapAttributes | undefined {
  const programId = JUPITER_V6_PROGRAM_ID;
  const accountInfosMap: AccountInfoMap = new Map();

  const logMessages = tx.meta.logMessages;
  if (!logMessages) {
    throw new Error('Missing log messages...');
  }

  const parser = new InstructionParser(programId);
  const events = getEvents(program, tx);

  const swapEvents = reduceEventData<SwapEvent>(events, 'SwapEvent');
  const feeEvent = reduceEventData<FeeEvent>(events, 'FeeEvent')[0];

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

  const swapData = parseSwapEvents(swapEvents);
  const instructions = parser.getInstructions(tx);
  const [initialPositions, finalPositions] =
    parser.getInitialAndFinalSwapPositions(instructions);

  const inMint = swapData[initialPositions[0]].inMint;
  const inSwapData = swapData.filter(
    (swap, index) => initialPositions.includes(index) && swap.inMint === inMint
  );
  const inAmount = inSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.inAmount);
  }, BigInt(0));

  const outMint = swapData[finalPositions[0]].outMint;
  const outSwapData = swapData.filter(
    (swap, index) => finalPositions.includes(index) && swap.outMint === outMint
  );
  const outAmount = outSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.outAmount);
  }, BigInt(0));

  const swap = {} as SwapAttributes;

  const [instructionName, transferAuthority, lastAccount] =
    parser.getInstructionNameAndTransferAuthorityAndLastAccount(instructions);

  swap.transferAuthority = transferAuthority;
  swap.lastAccount = lastAccount;
  swap.instruction = instructionName;
  swap.owner = tx.transaction.message.accountKeys[0].pubkey.toBase58();
  swap.programId = programId.toBase58();
  swap.signature = signature;
  swap.legCount = swapEvents.length;

  swap.inAmount = inAmount;
  swap.inMint = inMint;

  swap.outAmount = outAmount;
  swap.outMint = outMint;

  const exactOutAmount = parser.getExactOutAmount(
    tx.transaction.message.instructions
  );
  if (exactOutAmount) {
    swap.exactOutAmount = BigInt(exactOutAmount);
  }

  const exactInAmount = parser.getExactInAmount(
    tx.transaction.message.instructions
  );
  if (exactInAmount) {
    swap.exactInAmount = BigInt(exactInAmount);
  }

  swap.swapData = JSON.parse(JSON.stringify(swapData));

  if (feeEvent) {
    const { mint, amount } = extractVolume(feeEvent.mint, feeEvent.amount);
    swap.feeTokenPubkey = feeEvent.account.toBase58();
    swap.feeOwner = extractTokenAccountOwner(
      accountInfosMap,
      feeEvent.account
    )?.toBase58();
    swap.feeAmount = BigInt(amount);
    swap.feeMint = mint;
  }

  return swap;
}

function parseSwapEvents(swapEvents: SwapEvent[]) {
  const swapData = swapEvents.map((swapEvent) => extractSwapData(swapEvent));

  return swapData;
}

function extractSwapData(swapEvent: SwapEvent) {
  const amm =
    AMM_TYPES[swapEvent.amm.toBase58()] ??
    `Unknown program ${swapEvent.amm.toBase58()}`;

  const { mint: inMint, amount: inAmount } = extractVolume(
    swapEvent.inputMint,
    swapEvent.inputAmount
  );
  const { mint: outMint, amount: outAmount } = extractVolume(
    swapEvent.outputMint,
    swapEvent.outputAmount
  );

  return {
    amm,
    inMint,
    inAmount,
    outMint,
    outAmount,
  };
}

function extractVolume(mint: PublicKey, amount: BN) {
  return {
    mint: mint.toBase58(),
    amount: amount.toString(),
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
