import { IdlEvents, IdlTypes } from '@coral-xyz/anchor';
import { Jupiter } from './idl/jupiter';
import { ParsedInstruction, PublicKey } from '@solana/web3.js';

export type SwapEvent = IdlEvents<Jupiter>['SwapEvent'];
export type FeeEvent = IdlEvents<Jupiter>['FeeEvent'];
type RoutePlanStep = IdlTypes<Jupiter>['RoutePlanStep'];
export type RoutePlan = RoutePlanStep[];

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
