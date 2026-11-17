import { keccak256 } from "viem";
import { utf8Encode } from "../bytes";
import type { StoredGroup } from "../records";

export const pollRoster = (record: StoredGroup): string[] =>
  record.members.map((member) => member.deviceKey.toLowerCase());

export function pollRosterHash(roster: readonly string[]): string {
  return keccak256(utf8Encode([...roster].sort().join(",")));
}

export function verifiedPollRoster(
  record: StoredGroup,
  epoch: number | null,
  hash: string
): string[] | null {
  const committed =
    epoch === record.epoch
      ? pollRoster(record)
      : record.previousPollRosters?.[String(epoch)];
  return committed && committed.length > 0 && pollRosterHash(committed) === hash
    ? committed
    : null;
}
