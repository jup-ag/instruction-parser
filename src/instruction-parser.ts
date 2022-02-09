import {
  AccountMeta,
  ParsedMessageAccount,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import type { Instruction } from "@project-serum/anchor";
import { BorshCoder } from "@project-serum/anchor";
import { IDL } from "./idl/jupiter";
import { InstructionDisplay } from "@project-serum/anchor/dist/cjs/coder/borsh/instruction";

export const JUPITER_V2_PROGRAM_ID = new PublicKey(
  "JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo"
);

// This mapping is derived from the Jupiter IDL.
const accountNamesMapping = {
  tokenSwap: {
    source: sentenceCase("source"),
    destination: sentenceCase("destination"),
  },
  mercurialExchange: {
    source: sentenceCase("sourceTokenAccount"),
    destination: sentenceCase("destinationTokenAccount"),
  },
  serumSwap: {
    source: sentenceCase("orderPayerTokenAccount"),
    coin: sentenceCase("coinWallet"),
    pc: sentenceCase("pcWallet"),
  },
  stepTokenSwap: {
    source: sentenceCase("source"),
    destination: sentenceCase("destination"),
  },
  saberExchange: {
    source: sentenceCase("inputUserAccount"),
    destination: sentenceCase("outputUserAccount"),
  },
  cropperTokenSwap: {
    source: sentenceCase("source"),
    destination: sentenceCase("destination"),
  },
  raydiumSwap: {
    source: sentenceCase("userSourceTokenAccount"),
    destination: sentenceCase("userDestinationTokenAccount"),
  },
  raydiumSwapV2: {
    source: sentenceCase("userSourceTokenAccount"),
    destination: sentenceCase("userDestinationTokenAccount"),
  },
  aldrinSwap: {
    base: sentenceCase("userBaseTokenAccount"),
    quote: sentenceCase("userQuoteTokenAccount"),
  },
  aldrinV2Swap: {
    base: sentenceCase("userBaseTokenAccount"),
    quote: sentenceCase("userQuoteTokenAccount"),
  },
  cremaTokenSwap: {
    source: sentenceCase("userSourceTokenAccount"),
    destination: sentenceCase("userDestinationTokenAccount"),
  },
  senchaExchange: {
    source: sentenceCase("inputUserAccount"),
    destination: sentenceCase("outputUserAccount"),
  },
};

function sentenceCase(field: string): string {
  const result = field.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export class InstructionParser {
  private coder: BorshCoder;

  constructor() {
    this.coder = new BorshCoder(IDL);
  }

  // This methods will extract the user sender and receiver token accounts for each instruction
  public getSenderAndReceiverTokenAccounts(
    accountKeys: ParsedMessageAccount[],
    instruction: PartiallyDecodedInstruction
  ) {
    const accountMetas: AccountMeta[] = instruction.accounts.map((pubkey) => {
      const accountKey = accountKeys.find((ak) => {
        return ak.pubkey.equals(pubkey);
      });

      return {
        pubkey,
        isSigner: accountKey.signer,
        isWritable: accountKey.writable,
      };
    });

    const ix = this.coder.instruction.decode(instruction.data, "base58");

    if (!Object.keys(accountNamesMapping).includes(ix.name)) {
      return null;
    }

    const format = this.coder.instruction.format(ix, accountMetas);

    return this.extractSenderAndReceiverTokenAccounts(ix, format);
  }

  private extractSenderAndReceiverTokenAccounts(
    ix: Instruction,
    format: InstructionDisplay
  ) {
    const accountMapping = accountNamesMapping[ix.name];
    if (!accountMapping) {
      return null;
    }

    let source: PublicKey;
    let destination: PublicKey;

    // Serum destination token account depends on the source token account
    if (ix.name === "serumSwap") {
      source = format.accounts.find(
        ({ name }) => name === accountMapping["source"]
      ).pubkey;
      let coin = format.accounts.find(
        ({ name }) => name === accountMapping["coin"]
      ).pubkey;
      let pc = format.accounts.find(
        ({ name }) => name === accountMapping["pc"]
      ).pubkey;

      destination = coin.equals(source) ? pc : coin;
    } else if (ix.name === "aldrinV2Swap" || ix.name == "aldrinSwap") {
      let sourceKey = (ix.data as any).side.bid ? "quote" : "base";
      let destinationKey = (ix.data as any).side.bid ? "base" : "quote";

      source = format.accounts.find(
        ({ name }) => name === accountMapping[sourceKey]
      ).pubkey;
      destination = format.accounts.find(
        ({ name }) => name === accountMapping[destinationKey]
      ).pubkey;
    } else {
      source = format.accounts.find(
        ({ name }) => name === accountMapping["source"]
      ).pubkey;
      destination = format.accounts.find(
        ({ name }) => name === accountMapping["destination"]
      ).pubkey;
    }

    if (!source || !destination) {
      return null;
    }

    return {
      source,
      destination,
    };
  }
}
