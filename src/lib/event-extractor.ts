import { PublicKey } from "@solana/web3.js";
import { EventParser } from "@project-serum/anchor";
import { BorshCoder } from "@project-serum/anchor";
import { IDL } from "../idl/jupiter";

export class EventExtractor {
  private coder: BorshCoder;
  private parser: EventParser;

  constructor(programId: PublicKey) {
    this.coder = new BorshCoder(IDL);
    this.parser = new EventParser(programId, this.coder);
  }

  public getEvents(logs: string[]) {
    return Array.from(this.parser.parseLogs(logs));
  }
}
