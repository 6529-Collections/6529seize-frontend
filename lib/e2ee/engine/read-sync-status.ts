import type { E2eeReadSyncReason, E2eeReadSyncStatus } from "../types";
import type { EngineContext } from "./context";
import { knownOlderClient, selfGroupBudget } from "./self-group-claims";
import { activeSelfGroups, canonicalSelfGroup } from "./self-groups";

/**
 * The debug view of read-state sync (D175, P60) that staging builds show in
 * Devices: whom this device shares its self group with, and why missing
 * siblings are not in it yet. Read-only; never changes engine state.
 */
export function readSyncStatus(
  ctx: EngineContext,
  input: {
    /** Siblings this device added in this run, not heard from since. */
    readonly invited: ReadonlyMap<string, number>;
    /** Without a self group: when this device may create one. */
    readonly createDueAt: number | null;
    readonly nextMaintenanceAt: (g: string) => number;
  }
): E2eeReadSyncStatus | null {
  const device = ctx.device;
  if (!device?.registered) {
    return null;
  }
  const own = device.deviceKey.toLowerCase();
  const canonical = canonicalSelfGroup(ctx);
  const members = new Set(
    (canonical?.record.members ?? []).map((member) =>
      member.deviceKey.toLowerCase()
    )
  );
  const now = ctx.now();
  const labelOf = (key: string): string =>
    ctx.ownDevices.find((item) => item.device_key.toLowerCase() === key)
      ?.label || `${key.slice(0, 8)}…`;
  const missing = ctx.ownDevices
    .filter(
      (item) =>
        item.revoked_at === null &&
        item.grant.expires_at * 1000 > now &&
        item.device_key.toLowerCase() !== own &&
        !members.has(item.device_key.toLowerCase())
    )
    .map((item) => item.device_key.toLowerCase());
  const reasons: E2eeReadSyncReason[] = [];
  const older = missing.filter((key) => knownOlderClient(ctx, key));
  for (const key of older) {
    reasons.push({ kind: "older-key-packages", device: labelOf(key) });
  }
  for (const [key, since] of input.invited) {
    if (members.has(key)) {
      reasons.push({ kind: "invited", device: labelOf(key), since });
    }
  }
  const waiting = missing.length > older.length;
  if (waiting) {
    const budget = selfGroupBudget(ctx);
    if (budget.spent) {
      reasons.push({ kind: "claim-budget", nextAt: budget.nextAt });
    }
  }
  const nextAt = canonical
    ? waiting
      ? input.nextMaintenanceAt(canonical.record.g)
      : null
    : input.createDueAt;
  if (nextAt !== null) {
    reasons.push({ kind: "maintenance", nextAt });
  }
  return {
    group: canonical?.record.g ?? null,
    sharedWith: canonical && members.has(own) ? members.size - 1 : 0,
    olderGroups: Math.max(0, activeSelfGroups(ctx).length - 1),
    reasons,
  };
}
