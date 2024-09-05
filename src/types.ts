import { IdlEvents, IdlTypes } from "@coral-xyz/anchor";
import { Jupiter } from "./idl/jupiter";
import { ParsedInstruction, PublicKey } from "@solana/web3.js";

export type SwapEvent = IdlEvents<Jupiter>["SwapEvent"];
export type FeeEvent = IdlEvents<Jupiter>["FeeEvent"];
type RoutePlanStep = IdlTypes<Jupiter>["RoutePlanStep"];
export type RoutePlan = RoutePlanStep[];
export type SwapData = IdlTypes<Jupiter>["Swap"];

export type ParsedSwapEvent = {
  amm: PublicKey;
  inputMint: PublicKey;
  inputAmount: BigInt;
  outputMint: PublicKey;
  outputAmount: BigInt;
};

export type ParsedFeeEvent = {
  account: PublicKey;
  mint: PublicKey;
  amount: BigInt;
};

export type ParsedEvent = {
  data: ParsedSwapEvent | ParsedFeeEvent;
  name: string;
};

export type TransferInstructions = {
  inTransfers: ParsedInstruction[];
  outTransfers: ParsedInstruction[];
};

export type TransferData = {
  mint: PublicKey;
  amount: BigInt;
};

export type SwapFee = {
  account: PublicKey;
  mint: PublicKey;
  amount: BigInt;
};

export type RouteInfo = {
  index: number;
  stackHeight: number;
  name: string;
  accounts: PublicKey[];
  data: any;
};

export enum TransferType {
  IN,
  OUT,
}

export type Swap = {
  instructionIndex: number;
  stackHeight: number;
  nextSwapIndex: number;
  inAccount: PublicKey;
  outAccount: PublicKey;
};

export interface PartialInstruction {
  programId: PublicKey;
  data: string /** Expecting base58 */;
  accounts: PublicKey[];
}

// Subset of @solana/web3.js ParsedTransactionWithMeta to allow flexible upstream data
export interface TransactionWithMeta {
  meta: {
    logMessages?: string[] | null;
    innerInstructions?:
      | {
          index: number;
          instructions: (ParsedInstruction | PartialInstruction)[];
        }[]
      | null;
  } | null;
  transaction: {
    signatures: string[];
    message: {
      accountKeys: { pubkey: PublicKey }[];
      instructions: (ParsedInstruction | PartialInstruction)[];
    };
  };
}
