// src/index.ts
import { Program as Program2 } from "@coral-xyz/anchor";
import { unpackAccount } from "@solana/spl-token";

// src/lib/instruction-parser.ts
import { BorshCoder } from "@coral-xyz/anchor";

// src/idl/jupiter.ts
var IDL = {
  version: "0.1.0",
  name: "jupiter",
  instructions: [
    {
      name: "route",
      docs: ["route_plan Topologically sorted trade DAG"],
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "userSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "userDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        }
      ],
      args: [
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "inAmount",
          type: "u64"
        },
        {
          name: "quotedOutAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "routeWithTokenLedger",
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "userSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "userDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "tokenLedger",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "quotedOutAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "sharedAccountsRoute",
      docs: [
        "Route by using program owned token accounts and open orders accounts."
      ],
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "programAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "sourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "sourceMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "token2022Program",
          isMut: false,
          isSigner: false,
          isOptional: true
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        },
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "inAmount",
          type: "u64"
        },
        {
          name: "quotedOutAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "sharedAccountsRouteWithTokenLedger",
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "programAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "sourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "sourceMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "token2022Program",
          isMut: false,
          isSigner: false,
          isOptional: true
        },
        {
          name: "tokenLedger",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        },
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "quotedOutAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "exactOutRoute",
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "userSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "userDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "sourceMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "token2022Program",
          isMut: false,
          isSigner: false,
          isOptional: true
        }
      ],
      args: [
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "outAmount",
          type: "u64"
        },
        {
          name: "quotedInAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "sharedAccountsExactOutRoute",
      docs: [
        "Route by using program owned token accounts and open orders accounts."
      ],
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "programAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "userTransferAuthority",
          isMut: false,
          isSigner: true
        },
        {
          name: "sourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programSourceTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "programDestinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "sourceMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "destinationMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "platformFeeAccount",
          isMut: true,
          isSigner: false,
          isOptional: true
        },
        {
          name: "token2022Program",
          isMut: false,
          isSigner: false,
          isOptional: true
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        },
        {
          name: "routePlan",
          type: {
            vec: {
              defined: "RoutePlanStep"
            }
          }
        },
        {
          name: "outAmount",
          type: "u64"
        },
        {
          name: "quotedInAmount",
          type: "u64"
        },
        {
          name: "slippageBps",
          type: "u16"
        },
        {
          name: "platformFeeBps",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "setTokenLedger",
      accounts: [
        {
          name: "tokenLedger",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenAccount",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "createOpenOrders",
      accounts: [
        {
          name: "openOrders",
          isMut: true,
          isSigner: false
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "market",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "createTokenAccount",
      accounts: [
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bump",
          type: "u8"
        }
      ]
    },
    {
      name: "createProgramOpenOrders",
      accounts: [
        {
          name: "openOrders",
          isMut: true,
          isSigner: false
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "programAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "market",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        }
      ]
    },
    {
      name: "claim",
      accounts: [
        {
          name: "wallet",
          isMut: true,
          isSigner: false
        },
        {
          name: "programAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "claimToken",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "wallet",
          isMut: false,
          isSigner: false
        },
        {
          name: "programAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "programTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "destinationTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "id",
          type: "u8"
        }
      ],
      returns: "u64"
    },
    {
      name: "createTokenLedger",
      accounts: [
        {
          name: "tokenLedger",
          isMut: true,
          isSigner: true
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "TokenLedger",
      type: {
        kind: "struct",
        fields: [
          {
            name: "tokenAccount",
            type: "publicKey"
          },
          {
            name: "amount",
            type: "u64"
          }
        ]
      }
    }
  ],
  types: [
    {
      name: "AmountWithSlippage",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "slippageBps",
            type: "u16"
          }
        ]
      }
    },
    {
      name: "RoutePlanStep",
      type: {
        kind: "struct",
        fields: [
          {
            name: "swap",
            type: {
              defined: "Swap"
            }
          },
          {
            name: "percent",
            type: "u8"
          },
          {
            name: "inputIndex",
            type: "u8"
          },
          {
            name: "outputIndex",
            type: "u8"
          }
        ]
      }
    },
    {
      name: "PlatformFeeType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "SourceMint",
            fields: [
              {
                name: "mint",
                type: "publicKey"
              }
            ]
          },
          {
            name: "DestinationMint",
            fields: [
              {
                name: "mint",
                type: "publicKey"
              }
            ]
          },
          {
            name: "Zero"
          }
        ]
      }
    },
    {
      name: "Side",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Bid"
          },
          {
            name: "Ask"
          }
        ]
      }
    },
    {
      name: "Swap",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Saber"
          },
          {
            name: "SaberAddDecimalsDeposit"
          },
          {
            name: "SaberAddDecimalsWithdraw"
          },
          {
            name: "TokenSwap"
          },
          {
            name: "Sencha"
          },
          {
            name: "Step"
          },
          {
            name: "Cropper"
          },
          {
            name: "Raydium"
          },
          {
            name: "Crema",
            fields: [
              {
                name: "aToB",
                type: "bool"
              }
            ]
          },
          {
            name: "Lifinity"
          },
          {
            name: "Mercurial"
          },
          {
            name: "Cykura"
          },
          {
            name: "Serum",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "MarinadeDeposit"
          },
          {
            name: "MarinadeUnstake"
          },
          {
            name: "Aldrin",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "AldrinV2",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "Whirlpool",
            fields: [
              {
                name: "aToB",
                type: "bool"
              }
            ]
          },
          {
            name: "Invariant",
            fields: [
              {
                name: "xToY",
                type: "bool"
              }
            ]
          },
          {
            name: "Meteora"
          },
          {
            name: "GooseFX"
          },
          {
            name: "DeltaFi",
            fields: [
              {
                name: "stable",
                type: "bool"
              }
            ]
          },
          {
            name: "Balansol"
          },
          {
            name: "MarcoPolo",
            fields: [
              {
                name: "xToY",
                type: "bool"
              }
            ]
          },
          {
            name: "Dradex",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "LifinityV2"
          },
          {
            name: "RaydiumClmm"
          },
          {
            name: "Openbook",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "Phoenix",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "Symmetry",
            fields: [
              {
                name: "fromTokenId",
                type: "u64"
              },
              {
                name: "toTokenId",
                type: "u64"
              }
            ]
          },
          {
            name: "TokenSwapV2"
          },
          {
            name: "HeliumTreasuryManagementRedeemV0"
          },
          {
            name: "StakeDexStakeWrappedSol"
          },
          {
            name: "StakeDexSwapViaStake",
            fields: [
              {
                name: "bridgeStakeSeed",
                type: "u32"
              }
            ]
          },
          {
            name: "GooseFXV2"
          },
          {
            name: "Perps"
          },
          {
            name: "PerpsAddLiquidity"
          },
          {
            name: "PerpsRemoveLiquidity"
          },
          {
            name: "MeteoraDlmm"
          },
          {
            name: "OpenBookV2",
            fields: [
              {
                name: "side",
                type: {
                  defined: "Side"
                }
              }
            ]
          },
          {
            name: "RaydiumClmmV2"
          },
          {
            name: "StakeDexPrefundWithdrawStakeAndDepositStake",
            fields: [
              {
                name: "bridgeStakeSeed",
                type: "u32"
              }
            ]
          },
          {
            name: "Clone",
            fields: [
              {
                name: "poolIndex",
                type: "u8"
              },
              {
                name: "quantityIsInput",
                type: "bool"
              },
              {
                name: "quantityIsCollateral",
                type: "bool"
              }
            ]
          },
          {
            name: "SanctumS",
            fields: [
              {
                name: "srcLstValueCalcAccs",
                type: "u8"
              },
              {
                name: "dstLstValueCalcAccs",
                type: "u8"
              },
              {
                name: "srcLstIndex",
                type: "u32"
              },
              {
                name: "dstLstIndex",
                type: "u32"
              }
            ]
          },
          {
            name: "SanctumSAddLiquidity",
            fields: [
              {
                name: "lstValueCalcAccs",
                type: "u8"
              },
              {
                name: "lstIndex",
                type: "u32"
              }
            ]
          },
          {
            name: "SanctumSRemoveLiquidity",
            fields: [
              {
                name: "lstValueCalcAccs",
                type: "u8"
              },
              {
                name: "lstIndex",
                type: "u32"
              }
            ]
          },
          {
            name: "RaydiumCP"
          },
          {
            name: "WhirlpoolSwapV2",
            fields: [
              {
                name: "aToB",
                type: "bool"
              },
              {
                name: "remainingAccountsInfo",
                type: {
                  option: {
                    defined: "RemainingAccountsInfo"
                  }
                }
              }
            ]
          },
          {
            name: "OneIntro"
          },
          {
            name: "PumpdotfunWrappedBuy"
          },
          {
            name: "PumpdotfunWrappedSell"
          },
          {
            name: "PerpsV2"
          },
          {
            name: "PerpsV2AddLiquidity"
          },
          {
            name: "PerpsV2RemoveLiquidity"
          },
          {
            name: "MoonshotWrappedBuy"
          },
          {
            name: "MoonshotWrappedSell"
          },
          {
            name: "StabbleStableSwap"
          },
          {
            name: "StabbleWeightedSwap"
          },
          {
            name: "Obric",
            fields: [
              {
                name: "xToY",
                type: "bool"
              }
            ]
          },
          {
            name: "FoxBuyFromEstimatedCost"
          },
          {
            name: "FoxClaimPartial",
            fields: [
              {
                name: "isY",
                type: "bool"
              }
            ]
          },
          {
            name: "SolFi",
            fields: [
              {
                name: "isQuoteToBase",
                type: "bool"
              }
            ]
          }
        ]
      }
    },
    {
      name: "RemainingAccountsSlice",
      type: {
        kind: "struct",
        fields: [
          {
            name: "accountsType",
            type: {
              defined: "AccountsType"
            }
          },
          {
            name: "length",
            type: "u8"
          }
        ]
      }
    },
    {
      name: "RemainingAccountsInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "slices",
            type: {
              vec: {
                defined: "RemainingAccountsSlice"
              }
            }
          }
        ]
      }
    },
    {
      name: "AccountsType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "TransferHookA"
          },
          {
            name: "TransferHookB"
          }
        ]
      }
    }
  ],
  events: [
    {
      name: "SwapEvent",
      fields: [
        {
          name: "amm",
          type: "publicKey",
          index: false
        },
        {
          name: "inputMint",
          type: "publicKey",
          index: false
        },
        {
          name: "inputAmount",
          type: "u64",
          index: false
        },
        {
          name: "outputMint",
          type: "publicKey",
          index: false
        },
        {
          name: "outputAmount",
          type: "u64",
          index: false
        }
      ]
    },
    {
      name: "FeeEvent",
      fields: [
        {
          name: "account",
          type: "publicKey",
          index: false
        },
        {
          name: "mint",
          type: "publicKey",
          index: false
        },
        {
          name: "amount",
          type: "u64",
          index: false
        }
      ]
    }
  ],
  errors: [
    {
      code: 6e3,
      name: "EmptyRoute",
      msg: "Empty route"
    },
    {
      code: 6001,
      name: "SlippageToleranceExceeded",
      msg: "Slippage tolerance exceeded"
    },
    {
      code: 6002,
      name: "InvalidCalculation",
      msg: "Invalid calculation"
    },
    {
      code: 6003,
      name: "MissingPlatformFeeAccount",
      msg: "Missing platform fee account"
    },
    {
      code: 6004,
      name: "InvalidSlippage",
      msg: "Invalid slippage"
    },
    {
      code: 6005,
      name: "NotEnoughPercent",
      msg: "Not enough percent to 100"
    },
    {
      code: 6006,
      name: "InvalidInputIndex",
      msg: "Token input index is invalid"
    },
    {
      code: 6007,
      name: "InvalidOutputIndex",
      msg: "Token output index is invalid"
    },
    {
      code: 6008,
      name: "NotEnoughAccountKeys",
      msg: "Not Enough Account keys"
    },
    {
      code: 6009,
      name: "NonZeroMinimumOutAmountNotSupported",
      msg: "Non zero minimum out amount not supported"
    },
    {
      code: 6010,
      name: "InvalidRoutePlan",
      msg: "Invalid route plan"
    },
    {
      code: 6011,
      name: "InvalidReferralAuthority",
      msg: "Invalid referral authority"
    },
    {
      code: 6012,
      name: "LedgerTokenAccountDoesNotMatch",
      msg: "Token account doesn't match the ledger"
    },
    {
      code: 6013,
      name: "InvalidTokenLedger",
      msg: "Invalid token ledger"
    },
    {
      code: 6014,
      name: "IncorrectTokenProgramID",
      msg: "Token program ID is invalid"
    },
    {
      code: 6015,
      name: "TokenProgramNotProvided",
      msg: "Token program not provided"
    },
    {
      code: 6016,
      name: "SwapNotSupported",
      msg: "Swap not supported"
    },
    {
      code: 6017,
      name: "ExactOutAmountNotMatched",
      msg: "Exact out amount doesn't match"
    },
    {
      code: 6018,
      name: "SourceAndDestinationMintCannotBeTheSame",
      msg: "Source mint and destination mint cannot the same"
    }
  ]
};

// src/lib/instruction-parser.ts
var InstructionParser = class {
  constructor(programId) {
    this.programId = programId;
    this.coder = new BorshCoder(IDL);
  }
  getInstructionNameAndTransferAuthorityAndLastAccount(instructions) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      const ix = this.coder.instruction.decode(instruction.data, "base58");
      if (this.isRouting(ix.name)) {
        const instructionName = ix.name;
        const transferAuthority = instruction.accounts[this.getTransferAuthorityIndex(instructionName)].toString();
        const lastAccount = instruction.accounts[instruction.accounts.length - 1].toString();
        return [ix.name, transferAuthority, lastAccount];
      }
    }
    return [];
  }
  getTransferAuthorityIndex(instructionName) {
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
  getInstructions(tx) {
    const parsedInstructions = [];
    for (const instruction of tx.transaction.message.instructions) {
      if (instruction.programId.equals(this.programId)) {
        parsedInstructions.push(instruction);
      }
    }
    for (const instructions of tx.meta.innerInstructions) {
      for (const instruction of instructions.instructions) {
        if (instruction.programId.equals(this.programId)) {
          parsedInstructions.push(instruction);
        }
      }
    }
    return parsedInstructions;
  }
  // Extract the position of the initial and final swap from the swap array.
  getInitialAndFinalSwapPositions(instructions) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      const ix = this.coder.instruction.decode(instruction.data, "base58");
      if (!ix) {
        continue;
      }
      if (this.isRouting(ix.name)) {
        const routePlan = ix.data.routePlan;
        const inputIndex = 0;
        const outputIndex = routePlan.length;
        const initialPositions = [];
        for (let j = 0; j < routePlan.length; j++) {
          if (routePlan[j].inputIndex === inputIndex) {
            initialPositions.push(j);
          }
        }
        const finalPositions = [];
        for (let j = 0; j < routePlan.length; j++) {
          if (routePlan[j].outputIndex === outputIndex) {
            finalPositions.push(j);
          }
        }
        if (finalPositions.length === 0 && this.isCircular(ix.data.routePlan)) {
          for (let j = 0; j < ix.data.routePlan.length; j++) {
            if (ix.data.routePlan[j].outputIndex === 0) {
              finalPositions.push(j);
            }
          }
        }
        return [initialPositions, finalPositions];
      }
    }
  }
  getExactOutAmount(instructions) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      if (!("data" in instruction))
        continue;
      const ix = this.coder.instruction.decode(instruction.data, "base58");
      if (this.isExactIn(ix.name)) {
        return ix.data.quotedOutAmount.toString();
      }
    }
    return;
  }
  getExactInAmount(instructions) {
    for (const instruction of instructions) {
      if (!instruction.programId.equals(this.programId)) {
        continue;
      }
      if (!("data" in instruction))
        continue;
      const ix = this.coder.instruction.decode(instruction.data, "base58");
      if (this.isExactOut(ix.name)) {
        return ix.data.quotedInAmount.toString();
      }
    }
    return;
  }
  isExactIn(name) {
    return name === "route" || name === "routeWithTokenLedger" || name === "sharedAccountsRoute" || name === "sharedAccountsRouteWithTokenLedger";
  }
  isExactOut(name) {
    return name === "sharedAccountsExactOutRoute" || name === "exactOutRoute";
  }
  isRouting(name) {
    return name === "route" || name === "routeWithTokenLedger" || name === "sharedAccountsRoute" || name === "sharedAccountsRouteWithTokenLedger" || name === "sharedAccountsExactOutRoute" || name === "exactOutRoute";
  }
  isCircular(routePlan) {
    if (!routePlan || routePlan.length === 0) {
      return false;
    }
    const indexMap = new Map(
      routePlan.map((obj) => [obj.inputIndex, obj.outputIndex])
    );
    let visited = /* @__PURE__ */ new Set();
    let currentIndex = routePlan[0].inputIndex;
    while (true) {
      if (visited.has(currentIndex)) {
        return currentIndex === routePlan[0].inputIndex;
      }
      visited.add(currentIndex);
      if (!indexMap.has(currentIndex)) {
        return false;
      }
      currentIndex = indexMap.get(currentIndex);
    }
  }
};

// src/lib/get-events.ts
import { utils } from "@coral-xyz/anchor";

// src/constants.ts
import { PublicKey } from "@solana/web3.js";
var JUPITER_V6_PROGRAM_ID = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);
var AMM_TYPES = {
  DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1: "Orca v1",
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca",
  MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky: "Mercurial",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium",
  SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ: "Saber",
  PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP: "Penguin",
  AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6: "Aldrin",
  CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4: "Aldrin v2",
  SSwpMgqNDsyV7mAgN9ady4bDVu5ySjmmXejXvy2vLt1: "Step",
  CTMAxxk34HjKWxQ3QLZK1HpaLXmBveao3ESePXbiyfzh: "Cropper",
  SCHAtsf8mbjyjiv4LkhLKutTf6JnZAbdJKFkXQNMFHZ: "Sencha",
  CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR: "Crema",
  EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S: "Lifinity",
  SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr: "Saros",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Whirlpool",
  cysPXAjehMpVKUapzbMCCnpFxUFFryEWEaLgnb9NrR8: "Cykura",
  MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD: "Marinade",
  Dooar9JkhdZ7J3LHN3A7YCuoGRUggXhQaG4kijfLGU2j: "Stepn",
  Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB: "Meteora",
  HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt: "Invariant",
  "7WduLbRfYhTJktjLw5FDEyrqoEv61aTTCuGAetgLjzN5": "GooseFX",
  DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB: "Saber Decimal Wrapper",
  D3BBjqUdCYuP18fNvvMbPAZ8DpcRi4io2EsYHQawJDag: "Balansol",
  dp2waEWSBy5yKmq65ergoU3G6qRLmqa6K7We4rZSKph: "Dradex",
  "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c": "Lifinity v2",
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: "Raydium CLMM",
  srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: "Openbook",
  "9tKE7Mbmj4mxDjWatikzGAtkoWosiiZX9y6J4Hfm2R8H": "Marco Polo",
  PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY: "Phoenix",
  "2KehYt3KsEQR53jYcxjbQp2d2kCp4AkuQW68atufRwSr": "Symmetry",
  BSwp6bEBihVLdqJRKGgzjcGLHkcTuzmSo1TQkHepzH8p: "BonkSwap",
  FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X: "FluxBeam",
  treaf4wWBBty3fHdyBpo35Mz84M8k3heKXmjmi9vFt5: "Helium Network",
  stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq: "unstake.it",
  GFXsSL5sSaDfNFQUYsHekbWBW1TsFdjDYzACh62tEHxn: "GooseFX v2",
  PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu: "Perps",
  LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo: "Meteora DLMM",
  SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8: "Token Swap",
  opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb: "Openbook v2",
  DSwpgjMvXhtGn6BsbqmacdBZyfLj6jSWf3HJpdJtmg6N: "Dexlab",
  C1onEW2kPetmHmwe74YC1ESx3LnFEpVau6g2pg4fHycr: "Clone",
  CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C: "Raydium CP",
  H8W3ctz92svYg6mkn1UtGfu2aQr2fnUFHM1RhScEtQDt: "Cropper Whirlpool",
  "5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx": "Sanctum S",
  Gswppe6ERWKpUTXvRPfXdzHhiCyJvLadVvXGfdpBqcE1: "GuacSwap",
  DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm: "1DEX",
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P": "Pump.Fun",
  obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y: "Obric",
  SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe: "SolFi",
  HyhpEq587ANShDdbx1mP4dTmDZC44CXWft29oYQXDb53: "Fox"
};

// src/lib/get-events.ts
function getEvents(program2, transactionResponse) {
  var _a;
  let events = [];
  if (transactionResponse && transactionResponse.meta) {
    let { meta } = transactionResponse;
    (_a = meta.innerInstructions) == null ? void 0 : _a.map((ix) => {
      ix.instructions.map((iix) => {
        if (!iix || !iix.programId)
          return;
        if (!iix.programId.equals(JUPITER_V6_PROGRAM_ID))
          return;
        if (!("data" in iix))
          return;
        const ixData = utils.bytes.bs58.decode(iix.data);
        const eventData = utils.bytes.base64.encode(ixData.subarray(8));
        const event = program2.coder.events.decode(eventData);
        if (!event)
          return;
        events.push(event);
      });
    });
  }
  return events;
}

// src/index.ts
var program = new Program2(
  IDL,
  JUPITER_V6_PROGRAM_ID,
  {}
);
var reduceEventData = (events, name) => events.reduce((acc, event) => {
  if (event.name === name) {
    acc.push(event.data);
  }
  return acc;
}, new Array());
function extract(signature, tx) {
  var _a;
  const programId = JUPITER_V6_PROGRAM_ID;
  const accountInfosMap = /* @__PURE__ */ new Map();
  const logMessages = tx.meta.logMessages;
  if (!logMessages) {
    throw new Error("Missing log messages...");
  }
  const parser = new InstructionParser(programId);
  const events = getEvents(program, tx);
  const swapEvents = reduceEventData(events, "SwapEvent");
  const feeEvent = reduceEventData(events, "FeeEvent")[0];
  if (swapEvents.length === 0) {
    return;
  }
  const accountsToBeFetched = new Array();
  swapEvents.forEach((swapEvent) => {
    accountsToBeFetched.push(swapEvent.inputMint);
    accountsToBeFetched.push(swapEvent.outputMint);
  });
  if (feeEvent) {
    accountsToBeFetched.push(feeEvent.account);
  }
  const swapData = parseSwapEvents(swapEvents);
  const instructions = parser.getInstructions(tx);
  const [initialPositions, finalPositions] = parser.getInitialAndFinalSwapPositions(instructions);
  const inMint = swapData[initialPositions[0]].inMint;
  const inSwapData = swapData.filter(
    (swap2, index) => initialPositions.includes(index) && swap2.inMint === inMint
  );
  const inAmount = inSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.inAmount);
  }, BigInt(0));
  const outMint = swapData[finalPositions[0]].outMint;
  const outSwapData = swapData.filter(
    (swap2, index) => finalPositions.includes(index) && swap2.outMint === outMint
  );
  const outAmount = outSwapData.reduce((acc, curr) => {
    return acc + BigInt(curr.outAmount);
  }, BigInt(0));
  const swap = {};
  const [instructionName, transferAuthority, lastAccount] = parser.getInstructionNameAndTransferAuthorityAndLastAccount(instructions);
  swap.transferAuthority = transferAuthority;
  swap.lastAccount = lastAccount;
  swap.instruction = instructionName;
  swap.owner = tx.transaction.message.accountKeys[0].pubkey.toBase58();
  swap.programId = programId.toBase58();
  swap.signature = signature;
  swap.legCount = swapEvents.length;
  swap.inAmount = inAmount;
  swap.inMint = inMint;
  swap.outAmount = outAmount;
  swap.outMint = outMint;
  const exactOutAmount = parser.getExactOutAmount(
    tx.transaction.message.instructions
  );
  if (exactOutAmount) {
    swap.exactOutAmount = BigInt(exactOutAmount);
  }
  const exactInAmount = parser.getExactInAmount(
    tx.transaction.message.instructions
  );
  if (exactInAmount) {
    swap.exactInAmount = BigInt(exactInAmount);
  }
  swap.swapData = JSON.parse(JSON.stringify(swapData));
  if (feeEvent) {
    const { mint, amount } = extractVolume(feeEvent.mint, feeEvent.amount);
    swap.feeTokenPubkey = feeEvent.account.toBase58();
    swap.feeOwner = (_a = extractTokenAccountOwner(
      accountInfosMap,
      feeEvent.account
    )) == null ? void 0 : _a.toBase58();
    swap.feeAmount = BigInt(amount);
    swap.feeMint = mint;
  }
  return swap;
}
function parseSwapEvents(swapEvents) {
  const swapData = swapEvents.map((swapEvent) => extractSwapData(swapEvent));
  return swapData;
}
function extractSwapData(swapEvent) {
  var _a;
  const amm = (_a = AMM_TYPES[swapEvent.amm.toBase58()]) != null ? _a : `Unknown program ${swapEvent.amm.toBase58()}`;
  const { mint: inMint, amount: inAmount } = extractVolume(
    swapEvent.inputMint,
    swapEvent.inputAmount
  );
  const { mint: outMint, amount: outAmount } = extractVolume(
    swapEvent.outputMint,
    swapEvent.outputAmount
  );
  return {
    amm,
    inMint,
    inAmount,
    outMint,
    outAmount
  };
}
function extractVolume(mint, amount) {
  return {
    mint: mint.toBase58(),
    amount: amount.toString()
  };
}
function extractTokenAccountOwner(accountInfosMap, account) {
  const accountData = accountInfosMap.get(account.toBase58());
  if (accountData) {
    const accountInfo = unpackAccount(account, accountData, accountData.owner);
    return accountInfo.owner;
  }
  return;
}
export {
  extract,
  program
};
//# sourceMappingURL=index.mjs.map