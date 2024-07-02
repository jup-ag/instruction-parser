import { PublicKey } from "@solana/web3.js";

export const JUPITER_V6_PROGRAM_ID = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);

export const TRANSFER_INSTRUCTION_TYPES = new Set<string>([
  "transfer",
  "transferChecked",
  "mintTo",
  "burn",
]);

export const AMM_TYPES = {
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
};

export const STACK_HEIGHT = {
  SWAP: 2,
  FEE: 2,
  TOKEN_TRANSFER: 3,
};

export const SWAP_IN_OUT_ACCOUNTS_POSITION = {
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

export const SWAP_DIRECTION_ARGS = {
  SIDE: [
    "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6",
    "CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4",
    "dp2waEWSBy5yKmq65ergoU3G6qRLmqa6K7We4rZSKph",
    "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb",
    "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
    "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb",
  ],
  A_TO_B: [
    "H8W3ctz92svYg6mkn1UtGfu2aQr2fnUFHM1RhScEtQDt",
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR",
  ],
  X_TO_Y: [
    "HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt",
    "9tKE7Mbmj4mxDjWatikzGAtkoWosiiZX9y6J4Hfm2R8H",
    "BSwp6bEBihVLdqJRKGgzjcGLHkcTuzmSo1TQkHepzH8p",
  ],
  QUANTITY_IS_COLLATERAL: ["C1onEW2kPetmHmwe74YC1ESx3LnFEpVau6g2pg4fHycr"],
};

export const PLATFORM_FEE_ACCOUNTS_POSITION = {
  route: 6,
  routeWithTokenLedger: 6,
  sharedAccountsRoute: 9,
  sharedAccountsRouteWithTokenLedger: 9,
  sharedAccountsExactOutRoute: 9,
  exactOutRoute: 7,
};
