import type { ApiE2eeDevice } from "../api-types";
import { parseCredentialIdentity } from "../grant";
import type { StoredTrust } from "../records";
import type { E2eeUntrustedDevice } from "../types";
import type { ClaimedPackage } from "./claims";
import { checkpoint, type EngineContext } from "./context";

/**
 * Trust on first use for device owners. The delivery service decides which
 * profile a device is listed under, and a device grant is signed by a wallet
 * without naming the profile. So the wallets that signed a person's devices
 * are pinned the first time this profile sees that person, and afterwards
 * only devices signed by a pinned wallet are added automatically. A device
 * signed by any other wallet, or by a contract wallet whose signature could
 * not be checked here, waits for the user's explicit "Add device".
 */

type DeviceTrust = "trusted" | E2eeUntrustedDevice["reason"];

/** Bounds the explicit approve/ignore lists kept per profile. */
const MAX_DEVICE_DECISIONS = 500;
/** Bounds the wallets pinned per person (oldest dropped first). */
const MAX_PINNED_WALLETS = 16;

const emptyTrust = (): StoredTrust => ({
  wallets: {},
  approved: [],
  ignored: [],
});

const trustOf = (ctx: EngineContext): StoredTrust =>
  ctx.device?.trust ?? emptyTrust();

const storedPins = (ctx: EngineContext, profileId: string): string[] =>
  trustOf(ctx).wallets[profileId] ?? [];

/** Whether this profile has seen (and pinned) `profileId` before. */
export const hasPinnedWallets = (
  ctx: EngineContext,
  profileId: string
): boolean => storedPins(ctx, profileId).length > 0;

/** Pinned wallets of `profileId`; our own device's wallet always counts. */
export function isPinnedWallet(
  ctx: EngineContext,
  profileId: string,
  wallet: string
): boolean {
  const key = wallet.toLowerCase();
  if (profileId === ctx.profileId && ctx.device?.wallet.toLowerCase() === key) {
    return true;
  }
  return storedPins(ctx, profileId).includes(key);
}

export function classifyDevice(input: {
  approved: boolean;
  verified: boolean;
  pinned: boolean;
}): DeviceTrust {
  if (input.approved) {
    return "trusted";
  }
  if (!input.verified) {
    return "unverified";
  }
  return input.pinned ? "trusted" : "new-wallet";
}

/** Trust of a device whose grant is acceptable (caller checked `ok`). */
export async function deviceTrust(
  ctx: EngineContext,
  device: ApiE2eeDevice
): Promise<DeviceTrust> {
  const key = device.device_key.toLowerCase();
  const verification = await ctx.directory.verify(device);
  return classifyDevice({
    approved: trustOf(ctx).approved.includes(key),
    verified: verification.verified,
    pinned: isPinnedWallet(ctx, device.profile_id, device.grant.wallet),
  });
}

export const isIgnoredDevice = (
  ctx: EngineContext,
  deviceKey: string
): boolean => trustOf(ctx).ignored.includes(deviceKey.toLowerCase());

/** Persists the trust record with the device (no WASM export). */
async function saveTrust(ctx: EngineContext, next: StoredTrust): Promise<void> {
  const device = ctx.device;
  if (!device) {
    return;
  }
  device.trust = next;
  await checkpoint(ctx, { device, skipWasm: true });
  // Revocations are judged against pinned wallets; judge them again.
  ctx.directory.resetRevocations();
}

/** Adds `key` as the newest entry (moving it if present), keeping `max`. */
const remember = (
  list: readonly string[],
  key: string,
  max: number = MAX_DEVICE_DECISIONS
): string[] => [...list.filter((item) => item !== key), key].slice(-max);

/**
 * First sighting: a person with no pinned wallet yet gets the wallets of the
 * given verified devices pinned. People already pinned are left unchanged.
 */
export async function pinFirstSighting(
  ctx: EngineContext,
  sightings: readonly { profileId: string; wallet: string }[]
): Promise<void> {
  const fresh = new Map<string, Set<string>>();
  for (const { profileId, wallet } of sightings) {
    if (hasPinnedWallets(ctx, profileId)) {
      continue;
    }
    const wallets = fresh.get(profileId) ?? new Set<string>();
    wallets.add(wallet.toLowerCase());
    fresh.set(profileId, wallets);
  }
  if (fresh.size === 0) {
    return;
  }
  const trust = trustOf(ctx);
  const wallets = { ...trust.wallets };
  for (const [profileId, set] of fresh) {
    // Insertion order, newest last, so the cap drops the oldest pins.
    wallets[profileId] = [...set].slice(-MAX_PINNED_WALLETS);
  }
  await saveTrust(ctx, { ...trust, wallets });
}

/** "Add device": pins the device's wallet for its owner and approves it. */
export async function approveDevice(
  ctx: EngineContext,
  device: { profileId: string; deviceKey: string; wallet: string }
): Promise<void> {
  const trust = trustOf(ctx);
  const key = device.deviceKey.toLowerCase();
  const wallet = device.wallet.toLowerCase();
  const pins = trust.wallets[device.profileId] ?? [];
  await saveTrust(ctx, {
    wallets: {
      ...trust.wallets,
      [device.profileId]: remember(pins, wallet, MAX_PINNED_WALLETS),
    },
    approved: remember(trust.approved, key),
    ignored: trust.ignored.filter((item) => item !== key),
  });
}

/** "Ignore": keeps the device out and stops showing its notice. */
export async function ignoreUntrustedDevice(
  ctx: EngineContext,
  deviceKey: string
): Promise<void> {
  const trust = trustOf(ctx);
  await saveTrust(ctx, {
    ...trust,
    ignored: remember(trust.ignored, deviceKey.toLowerCase()),
  });
}

/**
 * Leaves already in a group were checked when they joined it; a member seen
 * here for the first time pins the wallets of their verified leaves.
 */
export async function pinLeavesOnFirstSighting(
  ctx: EngineContext,
  members: readonly {
    deviceKey: string;
    profileId: string | null;
    identity: string;
  }[]
): Promise<void> {
  const sightings: { profileId: string; wallet: string }[] = [];
  for (const member of members) {
    const profileId = member.profileId;
    if (profileId === null || hasPinnedWallets(ctx, profileId)) {
      continue;
    }
    const credential = parseCredentialIdentity(member.identity);
    const device = await ctx.directory.getDevice(member.deviceKey);
    if (
      !credential ||
      device?.profile_id !== profileId ||
      device.revoked_at !== null ||
      device.grant.wallet.toLowerCase() !== credential.wallet
    ) {
      continue;
    }
    if ((await ctx.directory.verify(device)).verified) {
      sightings.push({ profileId, wallet: credential.wallet });
    }
  }
  await pinFirstSighting(ctx, sightings);
}

/** The claimed KeyPackages whose devices are trusted. */
export async function onlyTrustedPackages(
  ctx: EngineContext,
  packages: readonly ClaimedPackage[]
): Promise<ClaimedPackage[]> {
  const out: ClaimedPackage[] = [];
  for (const item of packages) {
    if ((await deviceTrust(ctx, item.device)) === "trusted") {
      out.push(item);
    }
  }
  return out;
}

/**
 * KeyPackages a new chat or new members may add: people seen for the first
 * time pin the wallets of their verified devices, then only trusted devices
 * remain.
 */
export async function trustedPackages(
  ctx: EngineContext,
  packages: readonly ClaimedPackage[]
): Promise<ClaimedPackage[]> {
  const sightings: { profileId: string; wallet: string }[] = [];
  for (const item of packages) {
    if ((await ctx.directory.verify(item.device)).verified) {
      sightings.push({
        profileId: item.device.profile_id,
        wallet: item.device.grant.wallet,
      });
    }
  }
  await pinFirstSighting(ctx, sightings);
  return onlyTrustedPackages(ctx, packages);
}
