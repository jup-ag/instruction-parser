import { Connection, ParsedInstruction, PublicKey } from "@solana/web3.js";
import {
  ParsedEvent,
  PartialInstruction,
  RouteInfo,
  Swap,
  SwapFee,
  SwapData,
  TransactionWithMeta,
  TransferInstructions,
  TransferType,
} from "../types";
import { BorshCoder } from "@coral-xyz/anchor";
import { IDL } from "../idl/jupiter";
import {
  getSwapDirection,
  isFeeInstruction,
  isRouting,
  isSwapInstruction,
  isTransferInstruction,
} from "./utils";
import {
  JUPITER_V6_PROGRAM_ID,
  MULTI_STEP_SWAPS,
  PLATFORM_FEE_ACCOUNTS_POSITION,
  SWAP_IN_OUT_ACCOUNTS_POSITION,
} from "../constants";
import {
  getAccount,
  getMint,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export class EventParser {
  private connection: Connection;
  private coder: BorshCoder;

  constructor(connection: Connection) {
    this.connection = connection;
    this.coder = new BorshCoder(IDL);
  }

  async getParsedEvents(tx: TransactionWithMeta, routeInfo: RouteInfo) {
    const events: ParsedEvent[] = [];
    const innerInstructions = this.getInnerInstructions(tx, routeInfo);
    const swaps = this.getSwaps(innerInstructions, routeInfo);

    for (const swap of swaps) {
      const transferInstructions = this.getInAndOutTransferInstructions(
        innerInstructions,
        swap
      );
      const inTransferData = await this.getTransferData(
        transferInstructions.inTransfers,
        TransferType.IN
      );
      const outTransferData = await this.getTransferData(
        transferInstructions.outTransfers,
        TransferType.OUT
      );
      const swapEvent: ParsedEvent = {
        data: {
          amm: innerInstructions[swap.instructionIndex].programId,
          inputMint: inTransferData.mint,
          inputAmount: inTransferData.amount,
          outputMint: outTransferData.mint,
          outputAmount: outTransferData.amount,
        },
        name: "ParsedSwapEvent",
      };
      events.push(swapEvent);
    }

    if (routeInfo.data.platformFeeBps > 0) {
      const swapFee = await this.getSwapFee(routeInfo, innerInstructions);
      if (!swapFee) return events; // In few cases, fee transfer doesn't occur even if platformFee is non-zero
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

  getRouteInfoList(tx: TransactionWithMeta): RouteInfo[] {
    const routeInfoList: RouteInfo[] = [];
    tx.transaction.message.instructions.forEach((instruction, index) => {
      if (instruction.programId.equals(JUPITER_V6_PROGRAM_ID)) {
        const ix = this.coder.instruction.decode(
          (instruction as PartialInstruction).data,
          "base58"
        );
        if (isRouting(ix.name)) {
          const routeInfo: RouteInfo = {
            index: index,
            name: ix.name,
            accounts: (instruction as PartialInstruction).accounts,
            data: ix.data,
          };
          routeInfoList.push(routeInfo);
        }
      }
    });
    return routeInfoList;
  }

  getInnerInstructions(tx: TransactionWithMeta, routeInfo: RouteInfo) {
    for (const instruction of tx.meta.innerInstructions) {
      if (instruction.index === routeInfo.index) {
        return instruction.instructions;
      }
    }
  }

  getSwaps(
    innerInstructions: (ParsedInstruction | PartialInstruction)[],
    routeInfo: RouteInfo
  ) {
    const swaps: Swap[] = [];
    for (let index = 0; index < innerInstructions.length; index++) {
      if (isSwapInstruction(innerInstructions[index])) {
        const routePlanIndex = swaps.length;
        const routePlan = routeInfo.data.routePlan[routePlanIndex];
        const swapIxName = Object.keys(routePlan.swap)[0];
        let swap: Swap;
        if (MULTI_STEP_SWAPS.includes(swapIxName)) {
          swap = this.getMultiStepSwap(
            innerInstructions,
            index,
            routePlan.swap as any
          );
        } else {
          swap = this.getSwap(innerInstructions, index, routePlan.swap as any);
        }
        swaps.push(swap);
        index = swap.nextSwapIndex - 1;
      }
    }
    return swaps;
  }

  // To handle swaps where two instructions of swap program are invoked to complete the swap.
  // One of the stakedex's swap (StakeDexPrefundWithdrawStakeAndDepositStake) uses following instructions to complete the swap:
  //   1. stakedex_prefund_withdraw_stake
  //   2. stakedex_deposit_stake
  // Similarly both openbook and serum swap use the following instructions to complete the swap.
  //   1. new_order_v3
  //   2. settle_funds
  getMultiStepSwap(
    innerInstructions: (PartialInstruction | ParsedInstruction)[],
    swapIxIndex: number,
    swapData: SwapData
  ) {
    const swapInstruction = innerInstructions[swapIxIndex];
    const swapIxName = Object.keys(swapData)[0];
    const positions = SWAP_IN_OUT_ACCOUNTS_POSITION[swapIxName];

    // Get inAccount from the first instruction
    // For StakeDexPrefundWithdrawStakeAndDepositStake swap, inAccount is determined using accounts of stakedex_prefund_withdraw_stake instruction
    // For openbook and serum swap, inAccount is determined using accounts of new_order_v3 instruction
    let swap = {
      inAccount: (swapInstruction as any).accounts[positions.in],
    } as Swap;

    // Skip the second instruction while finding next swap instruction because its part of the current swap
    let index = swapIxIndex + 1;
    while (
      index < innerInstructions.length &&
      (innerInstructions[index].programId.equals(swapInstruction.programId) ||
        !isSwapInstruction(innerInstructions[index]))
    ) {
      const currentInstruction = innerInstructions[index];
      // Get outAccount from second instruction
      if (currentInstruction.programId.equals(swapInstruction.programId)) {
        if (swapIxName == "openbook" || swapIxName == "serum") {
          // For openbook and serum swap, outAccount is determined using accounts of settle_funds instruction and side of swap
          const side = Object.keys(Object.values(swapData)[0]["side"])[0];
          swap.outAccount = (currentInstruction as any).accounts[
            positions.out[side]
          ];
        } else if (
          swapIxName == "stakeDexPrefundWithdrawStakeAndDepositStake"
        ) {
          // For StakeDexPrefundWithdrawStakeAndDepositStake swap, outAccount is determined using accounts of stakedex_deposit_stake instruction
          swap.outAccount = (currentInstruction as any).accounts[positions.out];
        }
      }
      index++;
    }
    swap.instructionIndex = swapIxIndex;
    swap.nextSwapIndex = index; // Index points to next swap instruction
    return swap;
  }

  getSwap(
    innerInstructions: (PartialInstruction | ParsedInstruction)[],
    swapIxIndex: number,
    swapData: SwapData
  ) {
    let swap = {} as Swap;
    const swapProgramId = innerInstructions[swapIxIndex].programId;
    const swapIxName = Object.keys(swapData)[0]; // get position based on instruction name
    const positions = SWAP_IN_OUT_ACCOUNTS_POSITION[swapIxName];
    const accounts = (innerInstructions[swapIxIndex] as PartialInstruction)
      .accounts;
    const inAccountPosition =
      positions.in < 0 ? accounts.length + positions.in : positions.in;
    const outAccountPosition =
      positions.out < 0 ? accounts.length + positions.out : positions.out;

    // Certain AMM uses an extra parameter to decide the in and out account positions
    [swap.inAccount, swap.outAccount] = getSwapDirection(
      swapProgramId.toBase58(),
      swapData
    )
      ? [accounts[inAccountPosition], accounts[outAccountPosition]]
      : [accounts[outAccountPosition], accounts[inAccountPosition]];

    // find next swap instruction index
    let index = swapIxIndex + 1;
    while (
      index < innerInstructions.length &&
      !isSwapInstruction(innerInstructions[index])
    ) {
      index++;
    }
    swap.instructionIndex = swapIxIndex;
    swap.nextSwapIndex = index;
    return swap;
  }

  getInAndOutTransferInstructions(
    innerInstructions: (PartialInstruction | ParsedInstruction)[],
    swap: Swap
  ) {
    const transferInstructions: TransferInstructions = {
      inTransfers: [],
      outTransfers: [],
    };
    const inAccount = swap.inAccount.toBase58();
    const outAccount = swap.outAccount.toBase58();

    for (
      let index = swap.instructionIndex + 1;
      index < swap.nextSwapIndex;
      index++
    ) {
      const innerInstruction = innerInstructions[index] as ParsedInstruction;
      const ixType = isTransferInstruction(innerInstruction);
      if (ixType) {
        const source = innerInstruction.parsed.info.source;
        const destination = innerInstruction.parsed.info.destination;

        if (ixType === "transfer" || ixType === "transferChecked") {
          if (inAccount === source)
            transferInstructions.inTransfers.push(innerInstruction);
          if (outAccount === destination)
            transferInstructions.outTransfers.push(innerInstruction);
        } else if (
          ixType === "burn" &&
          inAccount === innerInstruction.parsed.info.account
        ) {
          transferInstructions.inTransfers.push(innerInstruction);
        } else if (
          ixType === "mintTo" &&
          outAccount === innerInstruction.parsed.info.account
        ) {
          transferInstructions.outTransfers.push(innerInstruction);
        }
      }
    }
    return transferInstructions;
  }

  async getTransferData(
    transferInstructions: ParsedInstruction[],
    transferType: TransferType
  ) {
    let mint: PublicKey;
    let amount: bigint = BigInt(0);
    for (const instruction of transferInstructions) {
      // fee on transfer is only supported with transferChecked and transferCheckedWithFee
      if (
        instruction.parsed.type === "transferChecked" ||
        instruction.parsed.type === "transferCheckedWithFee"
      ) {
        // fee should only be deducted from out transfers.
        if (transferType === TransferType.OUT) {
          amount += BigInt(
            await this.getExactOutAmountAfterFee(
              instruction.parsed.info,
              instruction.parsed.type,
              this.connection
            )
          );
        } else {
          amount += BigInt(instruction.parsed.info.tokenAmount.amount);
        }
      } else {
        amount += BigInt(instruction.parsed.info.amount);
      }
    }

    const transferInstruction = transferInstructions[0];
    if (transferInstruction.parsed.type === "transfer") {
      const account =
        transferType === TransferType.IN
          ? new PublicKey(transferInstruction.parsed.info.destination)
          : new PublicKey(transferInstruction.parsed.info.source);
      const accountInfo = await getAccount(this.connection, account);
      mint = accountInfo.mint;
    } else {
      mint = new PublicKey(transferInstruction.parsed.info.mint);
    }
    return {
      mint,
      amount,
    };
  }

  async getSwapFee(
    routeInfo: RouteInfo,
    innerInstructions: (PartialInstruction | ParsedInstruction)[]
  ): Promise<SwapFee> {
    const position = PLATFORM_FEE_ACCOUNTS_POSITION[routeInfo.name];
    const feeAccount = routeInfo.accounts[position].toBase58();

    for (let innerInstruction of innerInstructions) {
      innerInstruction = innerInstruction as ParsedInstruction;
      if (!innerInstruction.parsed) continue;
      const destination = innerInstruction.parsed.info.destination;
      if (isFeeInstruction(innerInstruction, feeAccount, destination)) {
        let mint: PublicKey;
        let amount: BigInt;

        if (innerInstruction.parsed.type === "transfer") {
          const accountInfo = await getAccount(
            this.connection,
            new PublicKey(destination)
          );
          mint = accountInfo.mint;
        } else {
          mint = new PublicKey(innerInstruction.parsed.info.mint);
        }

        if (innerInstruction.parsed.type === "transferChecked") {
          amount = BigInt(innerInstruction.parsed.info.tokenAmount.amount);
        } else {
          amount = BigInt(innerInstruction.parsed.info.amount);
        }
        return {
          mint,
          amount,
          account: new PublicKey(destination),
        };
      }
    }
  }

  async getExactOutAmountAfterFee(
    info: any,
    transferInstructionType: string,
    connection: Connection
  ) {
    // fee should be calculated manually if transferChecked is used
    if (transferInstructionType == "transferChecked") {
      try {
        const mint = await getMint(
          connection,
          new PublicKey(info.mint),
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        const feeConfig = getTransferFeeConfig(mint);
        const feeBasisPoints =
          feeConfig.newerTransferFee.transferFeeBasisPoints;

        const amount = info.tokenAmount.amount;
        const fee = (BigInt(amount) * BigInt(feeBasisPoints)) / BigInt(10000);
        return BigInt(amount) - fee;
      } catch (_) {
        // handle transfer without transfer fee
        return BigInt(info.tokenAmount.amount);
      }
    } else {
      return BigInt(info.tokenAmount.amount) - BigInt(info.feeAmount.amount);
    }
  }
}
