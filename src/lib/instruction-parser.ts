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
      // This will happen because now event is also an CPI instruction.
      if (!ix) {
        continue;
      }

      if (this.isRouting(ix.name)) {
        const inputIndex = 0;
        const outputIndex = (ix.data as any).routePlan.length;

        const initialPositions = [];
        for (let j = 0; j < (ix.data as any).routePlan.length; j++) {
          if ((ix.data as any).routePlan[j].inputIndex === inputIndex) {
            initialPositions.push(j);
          }
        }

        const finalPositions = [];
        for (let j = 0; j < (ix.data as any).routePlan.length; j++) {
          if ((ix.data as any).routePlan[j].outputIndex === outputIndex) {
            finalPositions.push(j);
          }
        }

        return [initialPositions, finalPositions];
      } else if (ix.name === "whirlpoolSwapExactOutput") {
        // Exact out only has one 1 swap. So, in and out final position is always at the 0th index of the swap array.
        return [[0], [0]];
      }
    }
  }

  getExactOutAmount(instructions: PartiallyDecodedInstruction[]) {
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (this.isRouting(ix.name)) {
        return (ix.data as any).quotedOutAmount.toString();
      }
    }

    return;
  }

  isRouting(name: string) {
    return (
      name === "route" ||
      name === "routeWithTokenLedger" ||
      name === "sharedAccountsRoute" ||
      name === "sharedAccountsRouteWithTokenLedger"
    );
  }
}
