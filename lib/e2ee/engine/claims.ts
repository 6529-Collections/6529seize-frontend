import { E2EE_CIPHERSUITE } from "../grant";
import type {
  ApiE2eeClaimTarget,
  ApiE2eeDevice,
  ApiE2eePolicyStatus,
} from "../api-types";
import { checkpoint, ownDeviceKey, type EngineContext } from "./context";

/** KeyPackage claims (4.2) with client-side grant checks of every device. */

const MAX_TARGETS_PER_CLAIM = 100;
/**
 * Most claims of one sibling's KeyPackages in one claim-through pass (P60
 * §2 rule 6): a pool holds at most 30 one-time KeyPackages, and past them,
 * or past the server's limit of 30 claims of a device an hour, the server
 * hands out the last-resort one.
 */
const MAX_CLAIM_THROUGH = 31;

export interface ClaimedPackage {
  /** Base64 KeyPackage. */
  keyPackage: string;
  device: ApiE2eeDevice;
  /** The device's last-resort KeyPackage (handed out again, not used up). */
  lastResort?: boolean;
}

interface ClaimedPackages {
  status: Map<string, ApiE2eePolicyStatus>;
  /** One usable KeyPackage per device, in claim order. */
  packages: ClaimedPackage[];
}

const emptyClaim = (): ClaimedPackages => ({
  status: new Map(),
  packages: [],
});

/**
 * A self group admits only clients that support self groups, by the
 * capability their KeyPackage lists (P60 §2 rule 6). A client built before
 * them is skipped and never becomes a member that never acts.
 *
 * The server hands out KeyPackages oldest first, so a sibling that updated
 * may still have older ones queued ahead of its new ones. Once it shows it
 * updated (it replaced its last-resort KeyPackage since this device last
 * claimed through its pool), this device claims through that pool in one
 * pass, until a capable KeyPackage or the last-resort one, which the
 * updated client replaced at once. A sibling still on an older client is
 * claimed through at most once per last-resort KeyPackage it uploads.
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
  for (const item of packages) {
    if (mls.supportsSelfGroups(item.keyPackage)) {
      out.push(item);
      continue;
    }
    const listed =
      item.lastResort === true ? undefined : claimThroughDue(ctx, item.device);
    if (listed === undefined) {
      continue;
    }
    let capable: ClaimedPackage | null;
    try {
      capable = await claimThrough(ctx, item.device, group);
    } catch {
      // Refused (say, past the claim rate limit) or failed: the pass goes on
      // without this sibling and the next one claims through again.
      continue;
    }
    await noteClaimedThrough(ctx, item.device, listed);
    if (capable) {
      out.push(capable);
    }
  }
  return out;
}

/**
 * The expiry of the sibling's last-resort KeyPackage as last listed, when
 * it replaced that KeyPackage since this device last claimed through its
 * pool; else undefined.
 */
function claimThroughDue(
  ctx: EngineContext,
  device: ApiE2eeDevice
): number | undefined {
  const key = device.device_key.toLowerCase();
  const listed = ctx.ownKeyPackages.get(key);
  const done = ctx.device?.readSync?.claimedThrough?.[key];
  return device.profile_id === ctx.profileId &&
    typeof listed === "number" &&
    done !== listed
    ? listed
    : undefined;
}

async function noteClaimedThrough(
  ctx: EngineContext,
  device: ApiE2eeDevice,
  listed: number
): Promise<void> {
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
  await checkpoint(ctx, { device: stored, skipWasm: true });
}

/**
 * Claims the sibling's next KeyPackages until a capable one, the
 * last-resort one or none. Returns the capable one, if any.
 */
async function claimThrough(
  ctx: EngineContext,
  device: ApiE2eeDevice,
  group: string | undefined
): Promise<ClaimedPackage | null> {
  const mls = ctx.mls;
  const key = device.device_key.toLowerCase();
  for (let claims = 1; mls && claims < MAX_CLAIM_THROUGH; claims += 1) {
    const claim = await claimKeyPackages(
      ctx,
      [{ profile_id: device.profile_id, device_keys: [key] }],
      group
    );
    const next = claim.packages.find(
      (item) => item.device.device_key.toLowerCase() === key
    );
    if (!next) {
      return null;
    }
    if (mls.supportsSelfGroups(next.keyPackage)) {
      // The device record this pass already trusted, not the new copy.
      return { ...next, device };
    }
    if (next.lastResort === true) {
      return null;
    }
  }
  return null;
}

/** device_key -> device record (leaf verification and roster_add). */
export const claimedDevices = (
  packages: readonly ClaimedPackage[]
): Map<string, ApiE2eeDevice> =>
  new Map(
    packages.map((item) => [item.device.device_key.toLowerCase(), item.device])
  );

/** An added device must be active, unexpired and carry a verified grant. */
export async function isUsableDevice(
  ctx: EngineContext,
  device: ApiE2eeDevice
): Promise<boolean> {
  if (device.revoked_at !== null) {
    return false;
  }
  const verification = await ctx.directory.verify(device);
  return verification.ok;
}

async function claimBatch(
  ctx: EngineContext,
  targets: ApiE2eeClaimTarget[],
  group: string | undefined,
  out: ClaimedPackages
): Promise<void> {
  const response = await ctx.api.claimKeyPackages({
    targets,
    claimer_device_key: ownDeviceKey(ctx),
    // Only current-suite groups take adds; superseded ones are read-only.
    ciphersuite: E2EE_CIPHERSUITE,
    ...(group ? { group } : {}),
  });
  const own = ownDeviceKey(ctx);
  for (const result of response.results) {
    out.status.set(result.profile_id, result.status);
    if (result.status !== "OK") {
      continue;
    }
    const wanted = targets.find(
      (target) => target.profile_id === result.profile_id
    );
    for (const claimed of result.key_packages) {
      const device = claimed.device;
      const key = device.device_key.toLowerCase();
      const allowed =
        key !== own &&
        device.profile_id === result.profile_id &&
        (wanted?.device_keys === undefined ||
          wanted.device_keys.includes(key)) &&
        !out.packages.some(
          (item) => item.device.device_key.toLowerCase() === key
        );
      ctx.directory.seed([device]);
      if (allowed && (await isUsableDevice(ctx, device))) {
        out.packages.push({
          keyPackage: claimed.key_package,
          device,
          lastResort: claimed.last_resort,
        });
      }
    }
  }
}

export async function claimKeyPackages(
  ctx: EngineContext,
  targets: ApiE2eeClaimTarget[],
  group?: string
): Promise<ClaimedPackages> {
  const out = emptyClaim();
  for (
    let offset = 0;
    offset < targets.length;
    offset += MAX_TARGETS_PER_CLAIM
  ) {
    await claimBatch(
      ctx,
      targets.slice(offset, offset + MAX_TARGETS_PER_CLAIM),
      group,
      out
    );
  }
  return out;
}
