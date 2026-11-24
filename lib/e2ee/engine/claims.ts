import { E2EE_CIPHERSUITE } from "../grant";
import type {
  ApiE2eeClaimTarget,
  ApiE2eeDevice,
  ApiE2eePolicyStatus,
} from "../api-types";
import { asE2eeApiError } from "../api-errors";
import { checkpoint, ownDeviceKey, type EngineContext } from "./context";

/** KeyPackage claims (4.2) with client-side grant checks of every device. */

const MAX_TARGETS_PER_CLAIM = 100;
const CLAIMS_RATE_LIMITED = "E2EE_RATE_LIMITED";
/** The server counts claims per profile in fixed clock hours. */
const CLAIM_WINDOW_MS = 60 * 60_000;

/**
 * Past the server's claim limit, self groups make no claims until its
 * window ends, leaving what is left to the user's own chats (P60 §2 rule 6).
 * The 429 carries no Retry-After; the window is a fixed clock hour.
 */
async function pauseSelfGroupClaims(ctx: EngineContext): Promise<void> {
  const stored = ctx.device;
  if (!stored) {
    return;
  }
  const now = ctx.now();
  stored.readSync ??= { unsent: [] };
  stored.readSync.claimsPausedUntil =
    now - (now % CLAIM_WINDOW_MS) + CLAIM_WINDOW_MS;
  await checkpoint(ctx, { device: stored, skipWasm: true });
}

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
  const response = await ctx.api
    .claimKeyPackages({
      targets,
      claimer_device_key: ownDeviceKey(ctx),
      // Only current-suite groups take adds; superseded ones are read-only.
      ciphersuite: E2EE_CIPHERSUITE,
      ...(group ? { group } : {}),
    })
    .catch(async (error: unknown) => {
      if (asE2eeApiError(error)?.code === CLAIMS_RATE_LIMITED) {
        await pauseSelfGroupClaims(ctx);
      }
      throw error;
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
