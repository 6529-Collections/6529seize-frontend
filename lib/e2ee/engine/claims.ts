import type {
  ApiE2eeClaimTarget,
  ApiE2eeDevice,
  ApiE2eePolicyStatus,
} from "../api-types";
import { ownDeviceKey, type EngineContext } from "./context";

/** KeyPackage claims (4.2) with client-side grant checks of every device. */

const MAX_TARGETS_PER_CLAIM = 100;

export interface ClaimedPackage {
  /** Base64 KeyPackage. */
  keyPackage: string;
  device: ApiE2eeDevice;
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
  const response = await ctx.api.claimKeyPackages({
    targets,
    claimer_device_key: ownDeviceKey(ctx),
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
        out.packages.push({ keyPackage: claimed.key_package, device });
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
