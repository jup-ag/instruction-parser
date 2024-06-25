import { Connection, ParsedInstruction, PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { IDL } from "../idl/jupiter"
import { ParsedEvent, PartialInstruction, RoutePlan, TransactionWithMeta, TransferData } from "../types";
import { AMM_TYPES } from "../constants";
import { getAccount } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

export class InstructionParser {
  private coder: BorshCoder;
  private programId: PublicKey;

  constructor(programId: PublicKey) {
    this.programId = programId;
    this.coder = new BorshCoder(IDL);
  }

  getInstructionNameAndTransferAuthorityAndLastAccount(
    instructions: PartialInstruction[]
  ) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (this.isRouting(ix.name)) {
        const instructionName = ix.name;
        const transferAuthority =
          instruction.accounts[
            this.getTransferAuthorityIndex(instructionName)
          ].toString();
        const lastAccount =
          instruction.accounts[instruction.accounts.length - 1].toString();

        return [ix.name, transferAuthority, lastAccount];
      }
    }

    return [];
  }

  getTransferAuthorityIndex(instructionName: string) {
    switch (instructionName) {
      case "route":
      case "exactOutRoute":
      case "routeWithTokenLedger":
        return 1;
      case "sharedAccountsRoute":
      case "sharedAccountsRouteWithTokenLedger":
      case "sharedAccountsExactOutRoute":
        return 2;
    }
  }

  // For CPI, we have to also check for innerInstructions.
  getInstructions(tx: TransactionWithMeta): PartialInstruction[] {
    const parsedInstructions: PartialInstruction[] = [];
    for (const instruction of tx.transaction.message.instructions) {
      if (instruction.programId.equals(this.programId)) {
        parsedInstructions.push(instruction as any);
      }
    }

    for (const instructions of tx.meta.innerInstructions) {
      for (const instruction of instructions.instructions) {
        if (instruction.programId.equals(this.programId)) {
          parsedInstructions.push(instruction as any);
        }
      }
    }

    return parsedInstructions;
  }

  // Extract the position of the initial and final swap from the swap array.
  getInitialAndFinalSwapPositions(instructions: PartialInstruction[]) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }

      const ix = this.coder.instruction.decode(instruction.data, "base58");
      // This will happen because now event is also an CPI instruction.
      if (!ix) {
        continue;
      }

      if (this.isRouting(ix.name)) {
        const routePlan = (ix.data as any).routePlan as RoutePlan;
        const inputIndex = 0;
        const outputIndex = routePlan.length;

        const initialPositions: number[] = [];
        for (let j = 0; j < routePlan.length; j++) {
          if (routePlan[j].inputIndex === inputIndex) {
            initialPositions.push(j);
          }
        }

        const finalPositions: number[] = [];
        for (let j = 0; j < routePlan.length; j++) {
          if (routePlan[j].outputIndex === outputIndex) {
            finalPositions.push(j);
          }
        }

        if (
          finalPositions.length === 0 &&
          this.isCircular((ix.data as any).routePlan)
        ) {
          for (let j = 0; j < (ix.data as any).routePlan.length; j++) {
            if ((ix.data as any).routePlan[j].outputIndex === 0) {
              finalPositions.push(j);
            }
          }
        }

        return [initialPositions, finalPositions];
      }
    }
  }

  async getParsedEvents(tx: TransactionWithMeta, connection: Connection) {
    
    const events: ParsedEvent[] = []; 
    const routingInstructionIndexes: number[] = []; 
    tx.transaction.message.instructions.forEach((instruction, index) => {
      if (instruction.programId.equals(this.programId)) { 
        const ix = this.coder.instruction.decode((instruction as PartialInstruction).data, "base58");
        if(this.isRouting(ix.name))
          routingInstructionIndexes.push(index);
      }
    })

    const innerInstructions: (PartialInstruction | ParsedInstruction)[] = [];
    const swapInstructionIndexes = [];

    for (const routingInstructionIndex of routingInstructionIndexes) {
      for (const instructions of tx.meta.innerInstructions) {
        if (instructions.index == routingInstructionIndex) {
          instructions.instructions.forEach((instruction, index) => {
            innerInstructions.push(instruction);
            if (instruction.programId.toBase58() in AMM_TYPES){
              swapInstructionIndexes.push(index);
            }
          })
          break
        }
      }
    }

    for (const index of swapInstructionIndexes) {
      const swapInstruction = innerInstructions[index];
      const [inTransferInstruction, outTransferInstruction] = this.getTransferInstructions(innerInstructions, index);

      const inTransferData = await this.getTransferData(inTransferInstruction, connection);
      const outTransferData = await this.getTransferData(outTransferInstruction, connection);


      const event: ParsedEvent = {
        data: {
          amm: swapInstruction.programId,
          inputMint: inTransferData.mint,
          inputAmount: inTransferData.amount,
          outputMint: outTransferData.mint,
          outputAmount: outTransferData.amount,
        },
        name: 'ParsedSwapEvent'
      }

      events.push(event)
    }

    return events;
  }

  getTransferInstructions(innerInstructions: (PartialInstruction | ParsedInstruction)[], swapInstructionIndex: number) {
    const transferInstructions: ParsedInstruction[] = [];
    const innerInstructionsLength = innerInstructions.length;

    for (let i = swapInstructionIndex + 1; i < innerInstructionsLength; i++){
      if (transferInstructions.length == 2) break
      const innerInstruction = innerInstructions[i];
      if (innerInstruction.programId.equals(TOKEN_PROGRAM_ID)) {
        const ixType = (innerInstruction as ParsedInstruction).parsed.type;
        if (ixType == "transfer" || ixType == "transferChecked") {
          transferInstructions.push(innerInstruction as ParsedInstruction);
        }
      }
    }

    return transferInstructions;
  }

  async getTransferData (transferInstruction: ParsedInstruction, connection: Connection): Promise<TransferData> {
    if (transferInstruction.parsed.type == 'transferChecked'){
      return {
        mint: new PublicKey(transferInstruction.parsed.info.mint),
        amount: transferInstruction.parsed.info.tokenAmount.amount
      }
    }
    else {
      const sourceInfo = await getAccount(connection, new PublicKey(transferInstruction.parsed.info.source));
      return {
        mint: sourceInfo.mint,
        amount: transferInstruction.parsed.info.amount
      }
    }
  }

  getExactOutAmount(instructions: (ParsedInstruction | PartialInstruction)[]) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      if (!("data" in instruction)) continue; // Guard in case it is a parsed decoded instruction, should be impossible

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (this.isExactIn(ix.name)) {
        return (ix.data as any).quotedOutAmount.toString();
      }
    }

    return;
  }

  getExactInAmount(instructions: (ParsedInstruction | PartialInstruction)[]) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      if (!("data" in instruction)) continue; // Guard in case it is a parsed decoded instruction, should be impossible

      const ix = this.coder.instruction.decode(instruction.data, "base58");

      if (this.isExactOut(ix.name)) {
        return (ix.data as any).quotedInAmount.toString();
      }
    }

    return;
  }

  isExactIn(name: string) {
    return (
      name === "route" ||
      name === "routeWithTokenLedger" ||
      name === "sharedAccountsRoute" ||
      name === "sharedAccountsRouteWithTokenLedger"
    );
  }

  isExactOut(name: string) {
    return name === "sharedAccountsExactOutRoute" || name === "exactOutRoute";
  }

  isRouting(name: string) {
    return (
      name === "route" ||
      name === "routeWithTokenLedger" ||
      name === "sharedAccountsRoute" ||
      name === "sharedAccountsRouteWithTokenLedger" ||
      name === "sharedAccountsExactOutRoute" ||
      name === "exactOutRoute"
    );
  }

  isCircular(routePlan: RoutePlan) {
    if (!routePlan || routePlan.length === 0) {
      return false; // Empty or null array is not circular
    }

    const indexMap = new Map(
      routePlan.map((obj) => [obj.inputIndex, obj.outputIndex])
    );
    let visited = new Set();
    let currentIndex = routePlan[0].inputIndex; // Start from the first object's inputIndex

    while (true) {
      if (visited.has(currentIndex)) {
        return currentIndex === routePlan[0].inputIndex;
      }

      visited.add(currentIndex);

      if (!indexMap.has(currentIndex)) {
        return false; // No further mapping, not circular
      }

      currentIndex = indexMap.get(currentIndex);
    }
  }
}
