import { keccak256 } from "viem";
import { utf8Encode } from "../bytes";
import type { StoredGroup } from "../records";

export const pollRoster = (record: StoredGroup): string[] =>
  record.members.map((member) => member.deviceKey.toLowerCase());

export const pollAttemptKey = (data: string): string =>
  keccak256(utf8Encode(data));

export function pollRosterHash(roster: readonly string[]): string {
  // Device keys are canonical ASCII hex. Use byte order on every device.
  const sorted = [...roster].sort((left, right) =>
    left < right ? -1 : Number(left > right)
  );
  return keccak256(utf8Encode(sorted.join(",")));
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
