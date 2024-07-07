import {
  ParsedMessage,
  ParsedMessageAccount,
  ParsedTransaction,
  ParsedInstruction,
  ParsedInnerInstruction,
  ParsedTransactionMeta,
  ParsedTransactionWithMeta,
  PublicKey,
  TransactionVersion,
  PartiallyDecodedInstruction,
  ParsedAddressTableLookup,
  LoadedAddresses,
} from "@solana/web3.js";

export function serialiseTransaction(tx: any): ParsedTransactionWithMeta {
  const parsedTransactionWithMeta = {} as ParsedTransactionWithMeta;
  parsedTransactionWithMeta.slot = tx.slot;
  parsedTransactionWithMeta.version = tx.version as TransactionVersion;
  parsedTransactionWithMeta.blockTime = tx.blockTime;
  const parsedTransaction = {} as ParsedTransaction;
  const message = {} as ParsedMessage;

  const accountKeys = [] as ParsedMessageAccount[];
  for (const account of tx.transaction.message.accountKeys) {
    const parsedAccount = {} as ParsedMessageAccount;
    parsedAccount.pubkey = new PublicKey(account.pubkey);
    parsedAccount.signer = account.signer;
    parsedAccount.writable = account.writable;
    parsedAccount.source = account.source as "transaction" | "lookupTable";
    accountKeys.push(parsedAccount);
  }

  message.accountKeys = accountKeys;
  const instructions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];
  for (const instruction of tx.transaction.message.instructions) {
    let parsedOrPartialInstruction = {} as
      | ParsedInstruction
      | PartiallyDecodedInstruction;
    if (instruction.parsed) {
      const parsedInstruction = {} as ParsedInstruction;
      parsedInstruction.parsed = instruction.parsed;
      parsedInstruction.program = instruction.program;
      parsedInstruction.programId = new PublicKey(instruction.programId);
      parsedOrPartialInstruction = parsedInstruction;
    } else {
      const partiallyDecodedInstruction = {} as PartiallyDecodedInstruction;
      for (const account of instruction.accounts) {
        if (!partiallyDecodedInstruction.accounts)
          partiallyDecodedInstruction.accounts = [];
        partiallyDecodedInstruction.accounts.push(new PublicKey(account));
      }
      partiallyDecodedInstruction.data = instruction.data;
      partiallyDecodedInstruction.programId = new PublicKey(
        instruction.programId
      );
      parsedOrPartialInstruction = partiallyDecodedInstruction;
    }
    instructions.push(parsedOrPartialInstruction);
  }
  message.instructions = instructions;
  message.recentBlockhash = tx.transaction.message.recentBlockhash;
  for (const addressTableLookup of tx.transaction.message.addressTableLookups) {
    const parsedAddressTableLookup = {} as ParsedAddressTableLookup;
    parsedAddressTableLookup.accountKey = new PublicKey(
      addressTableLookup.accountKey
    );
    parsedAddressTableLookup.writableIndexes =
      addressTableLookup.writableIndexes;
    parsedAddressTableLookup.readonlyIndexes =
      addressTableLookup.readonlyIndexes;
    if (!message.addressTableLookups) message.addressTableLookups = [];
    message.addressTableLookups.push(parsedAddressTableLookup);
  }

  parsedTransaction.message = message;
  parsedTransaction.signatures = tx.transaction.signatures;

  parsedTransactionWithMeta.transaction = parsedTransaction;

  const meta = {} as ParsedTransactionMeta;
  meta.logMessages = tx.meta.logMessages;
  meta.innerInstructions = [] as ParsedInnerInstruction[];
  for (const innerInstruction of tx.meta.innerInstructions) {
    const parsedInnerInstruction = {} as ParsedInnerInstruction;
    parsedInnerInstruction.index = innerInstruction.index;
    parsedInnerInstruction.instructions = [] as (
      | ParsedInstruction
      | PartiallyDecodedInstruction
    )[];
    for (const instruction of innerInstruction.instructions) {
      let parsedOrPartialInstruction = {} as
        | ParsedInstruction
        | PartiallyDecodedInstruction;
      if (instruction.parsed) {
        const parsedInstruction = {} as ParsedInstruction;
        parsedInstruction.parsed = instruction.parsed;
        parsedInstruction.program = instruction.program;
        parsedInstruction.programId = new PublicKey(instruction.programId);
        (parsedInstruction as any).stackHeight = instruction.stackHeight;
        parsedOrPartialInstruction = parsedInstruction;
      } else {
        const partiallyDecodedInstruction = {} as PartiallyDecodedInstruction;
        for (const account of (instruction as any).accounts) {
          if (!partiallyDecodedInstruction.accounts)
            partiallyDecodedInstruction.accounts = [];
          partiallyDecodedInstruction.accounts.push(new PublicKey(account));
        }
        partiallyDecodedInstruction.data = (instruction as any).data;
        partiallyDecodedInstruction.programId = new PublicKey(
          instruction.programId
        );
        (partiallyDecodedInstruction as any).stackHeight =
          instruction.stackHeight;
        parsedOrPartialInstruction = partiallyDecodedInstruction;
      }
      parsedInnerInstruction.instructions.push(parsedOrPartialInstruction);
    }
    meta.innerInstructions.push(parsedInnerInstruction);
  }

  meta.preBalances = tx.meta.preBalances;
  meta.postBalances = tx.meta.postBalances;
  meta.logMessages = tx.meta.logMessages;
  meta.preTokenBalances = tx.meta.preTokenBalances;
  meta.postTokenBalances = tx.meta.postTokenBalances;
  meta.err = tx.meta.err;
  meta.computeUnitsConsumed = tx.meta.computeUnitsConsumed;

  parsedTransactionWithMeta.meta = meta;

  return parsedTransactionWithMeta;
}
