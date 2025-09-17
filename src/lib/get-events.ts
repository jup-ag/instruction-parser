import { Event, Program, utils } from '@coral-xyz/anchor';
import { JUPITER_V6_PROGRAM_ID } from '../constants';
import { TransactionWithMeta } from '../types';

export function getEvents(
  program: Program,
  transactionResponse: TransactionWithMeta
) {
  let events: Event[] = [];

  if (transactionResponse && transactionResponse.meta) {
    let { meta } = transactionResponse;

    meta.innerInstructions?.map((ix) => {
      ix.instructions.map((iix) => {
        if (!iix || !iix.programId) return;
        if (!iix.programId.equals(JUPITER_V6_PROGRAM_ID)) return;
        if (!('data' in iix)) return; // Guard in case it is a parsed decoded instruction

        const ixData = utils.bytes.bs58.decode(iix.data);
        const eventData = utils.bytes.base64.encode(ixData.subarray(8));
        const event = program.coder.events.decode(eventData);

        if (!event) return;

        events.push(event);
      });
    });
  }

  return events;
}
