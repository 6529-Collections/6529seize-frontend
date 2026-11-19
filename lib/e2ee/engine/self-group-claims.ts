import type { ApiE2eeDevice } from "../api-types";
import { claimKeyPackages, type ClaimedPackage } from "./claims";
import { checkpoint, type EngineContext } from "./context";
import {
  budgetDevice,
  CLAIM_LOG_WINDOW_MS,
  selfGroupClaimShare,
} from "./self-group-budget";

/**
 * KeyPackage claims for self groups (P60 §2 rule 6).
 *
 * A self group admits only clients that support self groups, by the
 * capability their KeyPackage lists. The server hands out KeyPackages oldest
 * first, so a sibling that updated may still have older ones queued ahead
 * of its new ones; once it shows it updated (it replaced its last-resort
 * KeyPackage since this device last did this), this device claims through
 * that queue until a capable KeyPackage or the last-resort one.
 *
 * Claims share the server's limit of 120 per profile per clock hour with
 * starting chats, and all of a profile's devices count against it. Self
 * groups therefore keep to a budget of 24 claims an hour per profile (a
 * fifth), so at least 96 always stay for the user's own chats:
 * - each device keeps to its share of the budget (self-group-budget.ts) in
 *   any rolling hour, and records each claim before sending it, so a
 *   reload never forgets one the server may have counted;
 * - one sibling is claimed through per pass, and what the budget leaves
 *   is claimed at later passes (claims already made stay used up, so the
 *   queue keeps shrinking);
 * - a sibling whose queue was claimed through to its last-resort
 *   KeyPackage without a capable one runs an older client: it is claimed
 *   no more until it replaces that KeyPackage, as an update does;
 * - a refused claim (429) stops self-group claims until the server's
 *   window ends (claims.ts).
 */

/**
 * Most claims of one sibling in one claim-through pass: a queue holds at
 * most 30 one-time KeyPackages, and past them, or past the server's limit
 * of 30 claims of a device an hour, it hands out the last-resort one.
 */
const MAX_CLAIM_THROUGH = 31;

/**
 * The budget's clock: this device's clock as read at its last listing, plus
 * monotonic time since, so later changes to the device clock do not count.
 */
function budgetClock(
  ctx: EngineContext
): { now: number; listingAge: number } | null {
  const listed = ctx.listedAt;
  if (!listed) {
    return null;
  }
  const listingAge = ctx.monotonic() - listed.mono;
  return { now: listed.wall + listingAge, listingAge };
}

/** This device's share of the profile's self-group claim budget. */
function claimShare(
  ctx: EngineContext,
  clock: { now: number; listingAge: number }
): number {
  const own = ctx.device?.deviceKey;
  return own === undefined
    ? 0
    : selfGroupClaimShare({
        own,
        devices: ctx.ownDevices.map(budgetDevice),
        ...clock,
      });
}

/**
 * Reserves one claim of this device's self-group budget and records it on
 * the device record before the claim is sent: a claim that never reaches
 * the server stays counted, and a reload never forgets one that did. False
 * when the budget is spent for now.
 */
export async function reserveSelfGroupClaim(
  ctx: EngineContext
): Promise<boolean> {
  const stored = ctx.device;
  if (!stored) {
    return false;
  }
  const clock = budgetClock(ctx);
  stored.readSync ??= { unsent: [] };
  const state = stored.readSync;
  if (!clock || (state.claimsPausedUntil ?? 0) > ctx.now()) {
    return false;
  }
  const { now } = clock;
  // Stamps from a later clock reading (a clock set back) count as now.
  const recent = (state.selfGroupClaims ?? [])
    .map((at) => Math.min(at, now))
    .filter((at) => now - at < CLAIM_LOG_WINDOW_MS);
  if (recent.length >= claimShare(ctx, clock)) {
    state.selfGroupClaims = recent;
    return false;
  }
  state.selfGroupClaims = [...recent, now];
  await checkpoint(ctx, { device: stored, skipWasm: true });
  return true;
}

/**
 * This device's self-group budget for the debug status: whether its claims
 * are used up for now, and when one frees (by the budget's clock; null when
 * not known, as for a new device or without a fresh listing).
 */
export function selfGroupBudget(ctx: EngineContext): {
  spent: boolean;
  nextAt: number | null;
} {
  const clock = budgetClock(ctx);
  const state = ctx.device?.readSync;
  const pausedUntil = state?.claimsPausedUntil ?? 0;
  if (pausedUntil > ctx.now()) {
    return { spent: true, nextAt: pausedUntil };
  }
  if (!clock) {
    return { spent: true, nextAt: null };
  }
  const recent = (state?.selfGroupClaims ?? [])
    .map((at) => Math.min(at, clock.now))
    .filter((at) => clock.now - at < CLAIM_LOG_WINDOW_MS)
    .sort((a, b) => a - b);
  const share = claimShare(ctx, clock);
  if (recent.length < share) {
    return { spent: false, nextAt: null };
  }
  // One frees when all but share - 1 of them have left the window.
  const freeing = share > 0 ? recent[recent.length - share] : undefined;
  return {
    spent: true,
    nextAt: freeing === undefined ? null : freeing + CLAIM_LOG_WINDOW_MS,
  };
}

/** Writes the claim-through marks to the device record. */
export async function saveSelfGroupClaims(ctx: EngineContext): Promise<void> {
  if (ctx.device) {
    await checkpoint(ctx, { device: ctx.device, skipWasm: true });
  }
}

/**
 * The capable packages among `packages`; claims through one sibling whose
 * queue is due. The caller reserved its claim with `reserveSelfGroupClaim`
 * and saves the record afterwards.
 */
export async function selfGroupPackages(
  ctx: EngineContext,
  packages: readonly ClaimedPackage[],
  group?: string
): Promise<ClaimedPackage[]> {
  const mls = ctx.mls;
  if (!mls) {
    return [];
  }
  const out: ClaimedPackage[] = [];
  let claimedThroughOne = false;
  for (const item of packages) {
    if (mls.supportsSelfGroups(item.keyPackage)) {
      out.push(item);
      continue;
    }
    const listed = claimThroughDue(ctx, item.device);
    if (listed !== undefined && item.lastResort === true) {
      // Its queue is empty, and its last-resort KeyPackage lacks the
      // capability: an older client.
      noteOlderClient(ctx, item.device, listed);
    }
    if (listed === undefined || item.lastResort === true || claimedThroughOne) {
      continue;
    }
    claimedThroughOne = true;
    try {
      const result = await claimThrough(ctx, item.device, group);
      if (result.capable) {
        out.push(result.capable);
      } else if (result.done) {
        noteOlderClient(ctx, item.device, listed);
      }
    } catch {
      // Refused (a 429 also pauses self-group claims) or failed: the pass
      // goes on without this sibling, and a later one claims through again.
    }
  }
  return out;
}

/**
 * A sibling claimed through to its last-resort KeyPackage, which lacked the
 * capability, that has not replaced it since: an older client still.
 */
export function knownOlderClient(
  ctx: EngineContext,
  deviceKey: string
): boolean {
  const key = deviceKey.toLowerCase();
  const listed = ctx.ownKeyPackages.get(key);
  return (
    typeof listed === "number" &&
    ctx.device?.readSync?.claimedThrough?.[key] === listed
  );
}

/**
 * The expiry of the sibling's last-resort KeyPackage as last listed, when
 * its queue may be claimed through (it is not known to be an older client
 * still); else undefined.
 */
function claimThroughDue(
  ctx: EngineContext,
  device: ApiE2eeDevice
): number | undefined {
  const listed = ctx.ownKeyPackages.get(device.device_key.toLowerCase());
  return device.profile_id === ctx.profileId &&
    typeof listed === "number" &&
    !knownOlderClient(ctx, device.device_key)
    ? listed
    : undefined;
}

function noteOlderClient(
  ctx: EngineContext,
  device: ApiE2eeDevice,
  listed: number
): void {
  const stored = ctx.device;
  if (!stored) {
    return;
  }
  // In place: read sync holds this record across its own awaits.
  stored.readSync ??= { unsent: [] };
  stored.readSync.claimedThrough = {
    ...stored.readSync.claimedThrough,
    [device.device_key.toLowerCase()]: listed,
  };
}

/**
 * Claims the sibling's next KeyPackages, within the budget, until a capable
 * one, the last-resort one or none (`done`). Returns the capable one, if
 * any; not `done` when the budget ran out first.
 */
async function claimThrough(
  ctx: EngineContext,
  device: ApiE2eeDevice,
  group: string | undefined
): Promise<{ capable: ClaimedPackage | null; done: boolean }> {
  const mls = ctx.mls;
  const key = device.device_key.toLowerCase();
  for (let claims = 1; mls && claims < MAX_CLAIM_THROUGH; claims += 1) {
    if (!(await reserveSelfGroupClaim(ctx))) {
      return { capable: null, done: false };
    }
    const claim = await claimKeyPackages(
      ctx,
      [{ profile_id: device.profile_id, device_keys: [key] }],
      group
    );
    const next = claim.packages.find(
      (item) => item.device.device_key.toLowerCase() === key
    );
    if (!next) {
      return { capable: null, done: true };
    }
    if (mls.supportsSelfGroups(next.keyPackage)) {
      // The device record this pass already trusted, not the new copy.
      return { capable: { ...next, device }, done: true };
    }
    if (next.lastResort === true) {
      return { capable: null, done: true };
    }
  }
  return { capable: null, done: false };
}
