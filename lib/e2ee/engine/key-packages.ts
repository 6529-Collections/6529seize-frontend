import { asE2eeApiError } from "../api-errors";
import type { ApiE2eeKeyPackageStatus } from "../api-types";
import { E2EE_CIPHERSUITE } from "../grant";
import {
  checkpoint,
  DAY_MS,
  requireDevice,
  requireMls,
  type EngineContext,
} from "./context";

/** Contract 8.8: KeyPackage pool upkeep for this device. */

export const ONE_TIME_POOL = 30;
const ONE_TIME_REFILL_BELOW = 10;
const MAX_ONE_TIME = 100;
const ONE_TIME_LIFETIME_S = 30 * 86_400;
const LAST_RESORT_LIFETIME_S = 90 * 86_400;
const LAST_RESORT_ROTATE_MS = 30 * DAY_MS;

/** What one upload carries. */
interface KeyPackageUpload {
  readonly oneTime: number;
  readonly lastResort: boolean;
}

/**
 * Uploads `upload` in one request. With `replace` the request also replaces
 * this device's one-time pool (`replace_one_time`). An API from before that
 * field refuses it with a 400: then only `replace.fallback`, the usual
 * upkeep, goes up without it, taken from the KeyPackages already made.
 */
export async function uploadKeyPackages(
  ctx: EngineContext,
  upload: KeyPackageUpload,
  replace?: { readonly fallback: KeyPackageUpload }
): Promise<void> {
  const mls = requireMls(ctx);
  const device = requireDevice(ctx);
  const make = (count: number, lastResort: boolean) => {
    if (count <= 0) {
      return [];
    }
    const lifetime = lastResort ? LAST_RESORT_LIFETIME_S : ONE_TIME_LIFETIME_S;
    return mls
      .createKeyPackages(count, lastResort, lifetime, E2EE_CIPHERSUITE)
      .map((item) => ({
        data: item.data,
        last_resort: lastResort,
        expires_at: item.expires_at,
      }));
  };
  const oneTime = make(upload.oneTime, false);
  const lastResort = make(upload.lastResort ? 1 : 0, true);
  // Persist the private halves BEFORE the public halves leave the device.
  await checkpoint(ctx);
  let sent = upload;
  try {
    await ctx.api.uploadKeyPackages(device.deviceKey, {
      key_packages: [...oneTime, ...lastResort],
      ...(replace ? { replace_one_time: true } : {}),
    });
  } catch (error) {
    if (replace === undefined || asE2eeApiError(error)?.status !== 400) {
      throw error;
    }
    ctx.poolReplaceRefused = true;
    sent = replace.fallback;
    const fallback = [
      ...oneTime.slice(0, sent.oneTime),
      ...(sent.lastResort ? lastResort : []),
    ];
    if (fallback.length === 0) {
      return;
    }
    await ctx.api.uploadKeyPackages(device.deviceKey, {
      key_packages: fallback,
    });
  }
  const replaced = replace !== undefined && sent === upload;
  if (sent.lastResort) {
    device.lastResortAt = ctx.now();
    device.lastResortSelfSync = mls.makesSelfGroupKeyPackages();
  }
  if (replaced) {
    device.poolSelfSync = true;
  }
  if (sent.lastResort || replaced) {
    await checkpoint(ctx, { device, skipWasm: true });
  }
}

/**
 * Refills one-time KeyPackages below 10 and rotates the last-resort one.
 * A client with self groups first replaces the pool an older client left.
 */
export async function ensureKeyPackages(
  ctx: EngineContext,
  status: ApiE2eeKeyPackageStatus | null
): Promise<void> {
  const device = requireDevice(ctx);
  const selfGroups = requireMls(ctx).makesSelfGroupKeyPackages();
  const available = status?.one_time_available ?? 0;
  const refill =
    available < ONE_TIME_REFILL_BELOW
      ? Math.max(
          0,
          Math.min(ONE_TIME_POOL - available, MAX_ONE_TIME - available)
        )
      : 0;
  const lastResortMissing =
    status?.last_resort_expires_at === null || status === null;
  const lastResortStale =
    device.lastResortAt === null ||
    ctx.now() - device.lastResortAt >= LAST_RESORT_ROTATE_MS;
  // P60 §2 rule 6: updated from a client without self groups, replace the
  // last-resort KeyPackage at once; the change tells its siblings it
  // updated.
  const lastResortBeforeSelfGroups =
    device.lastResortSelfSync !== true && selfGroups;
  const lastResort =
    lastResortMissing || lastResortStale || lastResortBeforeSelfGroups;
  // The one-time pool goes with it, in the same request: the server hands a
  // device's one-time KeyPackages out oldest first, so until then every
  // claim of it would return one its older client made.
  if (device.poolSelfSync !== true && selfGroups && !ctx.poolReplaceRefused) {
    await uploadKeyPackages(
      ctx,
      { oneTime: ONE_TIME_POOL, lastResort: true },
      { fallback: { oneTime: refill, lastResort } }
    );
    return;
  }
  if (refill > 0) {
    await uploadKeyPackages(ctx, { oneTime: refill, lastResort: false });
  }
  if (lastResort) {
    await uploadKeyPackages(ctx, { oneTime: 0, lastResort: true });
  }
}
