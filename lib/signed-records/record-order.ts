import type { SignedRecordEvent } from "./record-event";

/**
 * The merge order of records: the newest change per (owner, type, key)
 * wins by (anchor, claimed time, event id), as the relays order them.
 */
interface RecordOrderKey {
  readonly anchor: number;
  readonly claimedTime: number;
  readonly eventId: string;
}

export function orderKeyOf(event: SignedRecordEvent): RecordOrderKey {
  return {
    anchor: event.anchor,
    claimedTime: event.claimed_time,
    eventId: event.id.toLowerCase(),
  };
}

const compareValues = <T extends number | string>(a: T, b: T): number => {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

export function compareOrderKeys(a: RecordOrderKey, b: RecordOrderKey): number {
  return (
    compareValues(a.anchor, b.anchor) ||
    compareValues(a.claimedTime, b.claimedTime) ||
    compareValues(a.eventId.toLowerCase(), b.eventId.toLowerCase())
  );
}
