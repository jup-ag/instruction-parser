import { Connection, ParsedInstruction, PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { IDL } from "../idl/jupiter";
import {
  ParsedEvent,
  PartialInstruction,
  RouteInfo,
  RoutePlan,
  Swap,
  SwapFee,
  SwapInfo,
  TransactionWithMeta,
  TransferType,
} from "../types";
import { getAccount } from "@solana/spl-token";
import {
  getSwapDirection,
  isFeeInstruction,
  isSwapInstruction,
  isTransferInstruction,
} from "./utils";
import {
  PLATFORM_FEE_ACCOUNTS_POSITION,
  SWAP_IN_OUT_ACCOUNTS_POSITION,
} from "../constants";

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
    const routeInfo: RouteInfo = this.getProgramInstructionInfo(tx);

    const { swaps, innerInstructions } = this.populateSwapsAndInnerInstructions(
      tx,
      routeInfo
    );

    for (let index = 0; index < swaps.length; index++) {
      const swap: SwapInfo = swaps[index];

      const transferInstructions = this.getInAndOutTransferInstructions(
        innerInstructions,
        swap.instructionIndex,
        swap.isAsk ? swap.inAccount : swap.outAccount,
        swap.isAsk ? swap.outAccount : swap.inAccount
      );

      const inTransferData = await this.deduceTokenTransfers(
        transferInstructions.inTransfers,
        connection,
        TransferType.IN
      );

      const outTransferData = await this.deduceTokenTransfers(
        transferInstructions.outTransfers,
        connection,
        TransferType.OUT
      );

      const swapEvent: ParsedEvent = {
        data: {
          amm: innerInstructions[swaps[index].instructionIndex].programId,
          inputMint: inTransferData.mint,
          inputAmount: inTransferData.amount,
          outputMint: outTransferData.mint,
          outputAmount: outTransferData.amount,
        },
        name: "ParsedSwapEvent",
      };

      events.push(swapEvent);
    }

    if (routeInfo.platformFeeBps > 0) {
      const swapFee = await this.getSwapFee(
        routeInfo,
        innerInstructions,
        connection
      );

      const feeEvent: ParsedEvent = {
        data: {
          account: swapFee.account,
          mint: swapFee.mint,
          amount: swapFee.amount,
        },
        name: "ParsedFeeEvent",
      };

      events.push(feeEvent);
    }

    return events;
  }

  getProgramInstructionInfo(tx: TransactionWithMeta): RouteInfo {
    const routeInfo = {} as RouteInfo;

    tx.transaction.message.instructions.forEach((instruction, index) => {
      if (instruction.programId.equals(this.programId)) {
        const ix = this.coder.instruction.decode(
          (instruction as PartialInstruction).data,
          "base58"
        );
        if (this.isRouting(ix.name)) {
          routeInfo.index = index;
          routeInfo.name = ix.name;
          routeInfo.accounts = (instruction as PartialInstruction).accounts;
          routeInfo.routePlan = (ix.data as any).routePlan as RoutePlan;
          routeInfo.platformFeeBps = (ix.data as any).platformFeeBps;
        }
      }
    });
    return routeInfo;
  }

  populateSwapsAndInnerInstructions(
    tx: TransactionWithMeta,
    routeInfo: RouteInfo
  ) {
    let innerInstructions: (PartialInstruction | ParsedInstruction)[];
    const swaps: SwapInfo[] = [];

    for (const instruction of tx.meta.innerInstructions) {
      if (instruction.index === routeInfo.index) {
        innerInstructions = instruction.instructions;
        instruction.instructions.forEach((instruction, index) => {
          if (isSwapInstruction(instruction)) {
            const routePlanIndex = swaps.length;
            const isAsk = getSwapDirection(
              instruction.programId.toBase58(),
              routeInfo.routePlan[routePlanIndex].swap
            );

            const [inAccount, outAccount] = this.getInAndOutAccountKeys(
              instruction,
              routeInfo.routePlan[routePlanIndex].swap
            );

            swaps.push({
              instructionIndex: index,
              isAsk,
              inAccount,
              outAccount,
            });
          }
        });
        break;
      }
    }

    return { swaps, innerInstructions };
  }

  getInAndOutTransferInstructions(
    innerInstructions: (PartialInstruction | ParsedInstruction)[],
    swapInstructionIndex: number,
    inAccount: PublicKey,
    outAccount: PublicKey
  ) {
    const transferInstructions = {
      inTransfers: [],
      outTransfers: [],
    };

    const inAccountKey = inAccount.toBase58();
    const outAccountKey = outAccount.toBase58();

    let pointerIndex = swapInstructionIndex + 1;
    while (
      pointerIndex < innerInstructions.length &&
      !isSwapInstruction(innerInstructions[pointerIndex])
    ) {
      const innerInstruction = innerInstructions[pointerIndex];
      const parsedInnerInstruction = innerInstruction as ParsedInstruction;
      const ixType = isTransferInstruction(parsedInnerInstruction);
      if (ixType) {
        const source = parsedInnerInstruction.parsed.info.source;
        const destination = parsedInnerInstruction.parsed.info.destination;

        if (ixType === "transfer" || ixType === "transferChecked") {
          if (inAccountKey === source)
            transferInstructions.inTransfers.push(parsedInnerInstruction);
          if (outAccountKey === destination)
            transferInstructions.outTransfers.push(parsedInnerInstruction);
        } else if (
          ixType === "burn" &&
          inAccountKey === parsedInnerInstruction.parsed.info.account
        ) {
          transferInstructions.inTransfers.push(parsedInnerInstruction);
        } else if (
          ixType === "mintTo" &&
          outAccountKey === parsedInnerInstruction.parsed.info.account
        ) {
          transferInstructions.outTransfers.push(parsedInnerInstruction);
        }
      }
      pointerIndex += 1;
    }

    return transferInstructions;
  }

  async deduceTokenTransfers(
    transferInstructions: ParsedInstruction[],
    connection: Connection,
    transferType: TransferType
  ) {
    let mint: PublicKey;

    const amount = transferInstructions.reduce((acc, instruction) => {
      if (instruction.parsed.type === "transferChecked") {
        return acc + BigInt(instruction.parsed.info.tokenAmount.amount);
      } else {
        return acc + BigInt(instruction.parsed.info.amount);
      }
    }, BigInt(0));

    const transferInstruction = transferInstructions[0];

    if (transferInstruction.parsed.type === "transfer") {
      const account =
        transferType === TransferType.IN
          ? new PublicKey(transferInstruction.parsed.info.destination)
          : new PublicKey(transferInstruction.parsed.info.source);
      const accountInfo = await getAccount(connection, account);
      mint = accountInfo.mint;
    } else {
      mint = new PublicKey(transferInstruction.parsed.info.mint);
    }

    return {
      mint,
      amount,
    };
  }

  getInAndOutAccountKeys(
    swapInstruction: PartialInstruction | ParsedInstruction,
    swapData: Swap
  ) {
    const ixName = Object.keys(swapData)[0]; // get position based on instruction name
    const positions = SWAP_IN_OUT_ACCOUNTS_POSITION[ixName];
    const accounts = (swapInstruction as PartialInstruction).accounts;

    const inAccountPostion =
      positions.in < 0 ? accounts.length + positions.in : positions.in;
    const outAccountPosition =
      positions.out < 0 ? accounts.length + positions.out : positions.out;

    return [accounts[inAccountPostion], accounts[outAccountPosition]];
  }

  async getSwapFee(
    routeInfo: RouteInfo,
    innerInstructions: (PartialInstruction | ParsedInstruction)[],
    connection: Connection
  ): Promise<SwapFee> {
    const feeAccountPosition = PLATFORM_FEE_ACCOUNTS_POSITION[routeInfo.name];
    const feeAccount = routeInfo.accounts[feeAccountPosition].toBase58();

    for (const innerInstruction of innerInstructions) {
      const parsedInnerInstruction = innerInstruction as ParsedInstruction;

      if (!parsedInnerInstruction.parsed) continue;
      const destination = parsedInnerInstruction.parsed.info.destination;

      if (isFeeInstruction(parsedInnerInstruction, feeAccount, destination)) {
        let mint: PublicKey;
        let amount: BigInt;

        if (parsedInnerInstruction.parsed.type === "transfer") {
          const accountInfo = await getAccount(
            connection,
            new PublicKey(destination)
          );
          mint = accountInfo.mint;
        } else {
          mint = new PublicKey(parsedInnerInstruction.parsed.info.mint);
        }

        if (parsedInnerInstruction.parsed.type === "transferChecked") {
          amount = BigInt(
            parsedInnerInstruction.parsed.info.tokenAmount.amount
          );
        } else {
          amount = BigInt(parsedInnerInstruction.parsed.info.amount);
        }

        return {
          mint,
          amount,
          account: new PublicKey(destination),
        };
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
