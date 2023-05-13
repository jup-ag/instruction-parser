import {
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import { BorshCoder } from "@project-serum/anchor";
import { IDL } from "../idl/jupiter";

export class InstructionParser {
  private coder: BorshCoder;
  private programId: PublicKey;

  constructor(programId: PublicKey) {
    this.programId = programId;
    this.coder = new BorshCoder(IDL);
  }

  // For CPI, we have to also check for innerInstructions.
  getInstructions(tx: ParsedTransactionWithMeta) {
    let parsedInstructions: PartiallyDecodedInstruction[] = [];
    const instructions = tx.transaction.message.instructions;
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      if (instruction.programId.equals(this.programId)) {
        parsedInstructions.push(instruction as any);
      }
    }

    const innerInstructions = tx.meta.innerInstructions;
    for (let i = 0; i < innerInstructions.length; i++) {
      const instructions = innerInstructions[i].instructions;
      for (let j = 0; j < instructions.length; j++) {
        let instruction = instructions[j];
        if (instruction.programId.equals(this.programId)) {
          parsedInstructions.push(instruction as any);
        }
      }
    }

    return parsedInstructions;
  }

  // Extract the position of the initial and final swap from the swap array.
  getInitialAndFinalSwapPositions(instructions: PartiallyDecodedInstruction[]) {
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (ix.name === "route") {
        const initialPositions = [];
        this.processSwapLegToExtractInitialPositions(
          (ix.data as any).swapLeg,
          -1,
          false,
          initialPositions
        );
        const finalPositions = [];
        this.processSwapLegToExtractFinalPositions(
          (ix.data as any).swapLeg,
          -1,
          finalPositions
        );

        return [initialPositions, finalPositions];
      } else if (ix.name === "whirlpoolSwapExactOutput") {
        // Exact out only has one 1 swap. So, in and out final position is always at the 0th index of the swap array.
        return [[0], [0]];
      }
    }
  }

  processSwapLegToExtractInitialPositions(
    swapLeg: any,
    position: number,
    swapYet: boolean,
    initialPositions: number[]
  ) {
    if (swapLeg.chain) {
      for (let i = 0; i < swapLeg.chain.swapLegs.length; i++) {
        position = this.processSwapLegToExtractInitialPositions(
          swapLeg.chain.swapLegs[i],
          position,
          swapYet,
          initialPositions
        );

        if (!swapYet && 0 === i && swapLeg.chain.swapLegs[i].swap) {
          swapYet = true;
          initialPositions.push(position);
        }
      }
    } else if (swapLeg.split) {
      for (let i = 0; i < swapLeg.split.splitLegs.length; i++) {
        position = this.processSwapLegToExtractInitialPositions(
          swapLeg.split.splitLegs[i].swapLeg,
          position,
          swapYet,
          initialPositions
        );

        if (!swapYet && swapLeg.split.splitLegs[i].swapLeg.swap) {
          initialPositions.push(position);
        }
      }
    } else if (swapLeg.swap) {
      return position + 1;
    }

    return position;
  }

  processSwapLegToExtractFinalPositions(
    swapLeg: any,
    position: number,
    finalPosition: number[]
  ) {
    if (swapLeg.chain) {
      for (let i = 0; i < swapLeg.chain.swapLegs.length; i++) {
        position = this.processSwapLegToExtractFinalPositions(
          swapLeg.chain.swapLegs[i],
          position,
          finalPosition
        );

        if (
          swapLeg.chain.swapLegs.length - 1 === i &&
          swapLeg.chain.swapLegs[i].swap
        ) {
          finalPosition.push(position);
        }
      }
    } else if (swapLeg.split) {
      for (let i = 0; i < swapLeg.split.splitLegs.length; i++) {
        position = this.processSwapLegToExtractFinalPositions(
          swapLeg.split.splitLegs[i].swapLeg,
          position,
          finalPosition
        );

        if (swapLeg.split.splitLegs[i].swapLeg.swap) {
          finalPosition.push(position);
        }
      }
    } else if (swapLeg.swap) {
      return position + 1;
    }

    return position;
  }

  getExactOutAmount(instructions: PartiallyDecodedInstruction[]) {
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (ix.name === "route") {
        return (ix.data as any).quotedOutAmount.toString();
      }
    }

    return;
  }
}
