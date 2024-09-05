import { PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { IDL } from "../idl/jupiter";
import { RouteInfo, RoutePlan } from "../types";

export class InstructionParser {
  private coder: BorshCoder;
  private programId: PublicKey;

  constructor(programId: PublicKey) {
    this.programId = programId;
    this.coder = new BorshCoder(IDL);
  }

  getInstructionNameAndTransferAuthorityAndLastAccount(routeInfo: RouteInfo) {
    const transferAuthority =
      routeInfo.accounts[
        this.getTransferAuthorityIndex(routeInfo.name)
      ].toString();
    const lastAccount =
      routeInfo.accounts[routeInfo.accounts.length - 1].toString();

    return [routeInfo.name, transferAuthority, lastAccount];
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

  // Extract the position of the initial and final swap from the swap array.
  getInitialAndFinalSwapPositions(routeInfo: RouteInfo) {
    const routePlan = routeInfo.data.routePlan;
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

    if (finalPositions.length === 0 && this.isCircular(routePlan)) {
      for (let j = 0; j < routePlan.length; j++) {
        if (routePlan[j].outputIndex === 0) {
          finalPositions.push(j);
        }
      }
    }

    return [initialPositions, finalPositions];
  }

  getExactOutAmount(routeInfo: RouteInfo) {
    if (this.isExactIn(routeInfo.name)) {
      return routeInfo.data.quotedOutAmount.toString();
    }
    return;
  }

  getExactInAmount(routeInfo: RouteInfo) {
    if (this.isExactOut(routeInfo.name)) {
      return routeInfo.data.quotedInAmount.toString();
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
