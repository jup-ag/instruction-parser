import { describe, expect, test } from "@jest/globals";
import {
  PLATFORM_FEE_ACCOUNTS_POSITION,
  STACK_HEIGHT,
  SWAP_DIRECTION_ARGS,
  SWAP_IN_OUT_ACCOUNTS_POSITION,
} from "../constants";

describe("Constants", () => {
  test("Should check positions are configured for all swap instructions  ", () => {
    const positionKeys = Object.keys(SWAP_IN_OUT_ACCOUNTS_POSITION);

    const expectedPositions = {
      aldrin: {
        in: 7,
        out: 8,
      },
      aldrinV2: {
        in: 7,
        out: 8,
      },
      balansol: {
        in: 6,
        out: 9,
      },
      clone: {
        in: 4,
        out: 5,
      },
      crema: {
        in: 4,
        out: 5,
      },
      cropper: {
        in: 4,
        out: 7,
      },
      cykura: {
        in: 3,
        out: 4,
      },
      deltaFi: {
        in: 2,
        out: 3,
      },
      dradex: {
        in: 9,
        out: 10,
      },
      gooseFX: {
        in: 8,
        out: 9,
      },
      gooseFXV2: {
        in: 5,
        out: 6,
      },
      heliumTreasuryManagementRedeemV0: {
        in: 5,
        out: 6,
      },
      invariant: {
        in: 3,
        out: 4,
      },
      lifinity: {
        in: 3,
        out: 4,
      },
      lifinityV2: {
        in: 3,
        out: 4,
      },
      marcoPolo: {
        in: 6,
        out: 7,
      },
      marinadeDeposit: {},
      marinadeUnstake: {},
      mercurial: {
        in: -2,
        out: -1,
      },
      meteora: {
        in: 1,
        out: 2,
      },
      meteoraDlmm: {
        in: 4,
        out: 5,
      },
      openBookV2: {
        in: 9,
        out: 10,
      },
      perps: {
        in: 1,
        out: 2,
      },
      perpsAddLiquidity: {
        in: 1,
        out: 2,
      },
      perpsRemoveLiquidity: {
        in: 2,
        out: 1,
      },
      phoenix: {
        in: 4,
        out: 5,
      },
      raydium: {
        in: 14,
        out: 15,
      },
      raydiumClmm: {
        in: 3,
        out: 4,
      },
      raydiumClmmV2: {
        in: 3,
        out: 4,
      },
      raydiumCp: {
        in: 4,
        out: 5,
      },
      saber: {
        in: 3,
        out: 6,
      },
      saberAddDecimalsDeposit: {
        in: 4,
        out: 5,
      },
      saberAddDecimalsWithdraw: {
        in: 5,
        out: 4,
      },
      sanctumS: {
        in: 3,
        out: 4,
      },
      sanctumSAddLiquidity: {
        in: 2,
        out: 3,
      },
      sanctumSRemoveLiquidity: {
        in: 3,
        out: 2,
      },
      sencha: {
        in: 3,
        out: 6,
      },
      openbook: {},
      serum: {},
      stakeDexStakeWrappedSol: {
        in: 1,
        out: 2,
      },
      stakeDexSwapViaStake: {},
      stakeDexPrefundWithdrawStakeAndDepositStake: {},
      step: {
        in: 3,
        out: 6,
      },
      symmetry: {
        in: 4,
        out: 6,
      },
      tokenSwap: {
        in: 3,
        out: 6,
      },
      tokenSwapV2: {
        in: 3,
        out: 6,
      },
      whirlpool: {
        in: 3,
        out: 5,
      },
      whirlpoolSwapV2: {
        in: 7,
        out: 9,
      },
    };

    for (const key in expectedPositions) {
      expect(positionKeys.includes(key)).toBe(true);
      expect(SWAP_IN_OUT_ACCOUNTS_POSITION[key].in).toEqual(
        expectedPositions[key].in
      );
    }
  });

  test("Should check swap args are configured correctly", () => {
    const args = ["SIDE", "A_TO_B", "X_TO_Y", "QUANTITY_IS_COLLATERAL"];
    const argsKeys = Object.keys(SWAP_DIRECTION_ARGS);

    for (const key in args) {
      expect(argsKeys.includes(args[key])).toBe(true);
    }
  });

  test("Should check SIDE arg is configured correctly", () => {
    const expectedInstructionsWithSideArg = [
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      "AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6",
      "CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4",
      "dp2waEWSBy5yKmq65ergoU3G6qRLmqa6K7We4rZSKph",
      "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb",
      "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
      "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb",
    ];

    for (const instruction of expectedInstructionsWithSideArg) {
      expect(SWAP_DIRECTION_ARGS.SIDE.includes(instruction)).toBe(true);
    }
  });

  test("Should check A_TO_B arg is configured correctly", () => {
    const expectedInstructionsWithAtoBArg = [
      "H8W3ctz92svYg6mkn1UtGfu2aQr2fnUFHM1RhScEtQDt",
      "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
      "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR",
    ];

    for (const instruction of expectedInstructionsWithAtoBArg) {
      expect(SWAP_DIRECTION_ARGS.A_TO_B.includes(instruction)).toBe(true);
    }
  });

  test("Should check X_TO_Y arg is configured correctly", () => {
    const expectedInstructionsWithXtoYArg = [
      "HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt",
      "9tKE7Mbmj4mxDjWatikzGAtkoWosiiZX9y6J4Hfm2R8H",
      "BSwp6bEBihVLdqJRKGgzjcGLHkcTuzmSo1TQkHepzH8p",
    ];

    for (const instruction of expectedInstructionsWithXtoYArg) {
      expect(SWAP_DIRECTION_ARGS.X_TO_Y.includes(instruction)).toBe(true);
    }
  });

  test("Should check QUANTITY_IS_COLLATERAL arg is configured correctly", () => {
    const expectedInstructionsWithQuantityIsCollateralArg = [
      "C1onEW2kPetmHmwe74YC1ESx3LnFEpVau6g2pg4fHycr",
    ];

    for (const instruction of expectedInstructionsWithQuantityIsCollateralArg) {
      expect(
        SWAP_DIRECTION_ARGS.QUANTITY_IS_COLLATERAL.includes(instruction)
      ).toBe(true);
    }
  });

  test("Should check fee positions are configured correctly", () => {
    const feePositionKeys = Object.keys(PLATFORM_FEE_ACCOUNTS_POSITION);
    const expectedFeePositions = {
      route: 6,
      routeWithTokenLedger: 6,
      sharedAccountsRoute: 9,
      sharedAccountsRouteWithTokenLedger: 9,
      sharedAccountsExactOutRoute: 9,
      exactOutRoute: 7,
    };

    for (const key in expectedFeePositions) {
      expect(feePositionKeys.includes(key)).toBe(true);
      expect(PLATFORM_FEE_ACCOUNTS_POSITION[key]).toEqual(
        expectedFeePositions[key]
      );
    }
  });

  test("Should check if stack heights are configured correctly", () => {
    const stackHeightKeys = Object.keys(STACK_HEIGHT);
    const expectedStackHeights = {
      SWAP: 2,
      FEE: 2,
      TOKEN_TRANSFER: 3,
    };

    for (const key in expectedStackHeights) {
      expect(stackHeightKeys.includes(key)).toBe(true);
      expect(STACK_HEIGHT[key]).toEqual(expectedStackHeights[key]);
    }
  });
});
