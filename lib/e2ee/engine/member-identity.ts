import { E2eeApiError } from "../api-errors";
import type { EngineContext } from "./context";

/** Display association only: never substitutes for device/grant verification. */
export function rememberDeviceProfile(
  ctx: EngineContext,
  deviceKey: string,
  profileId: string | null
): void {
  if (!profileId) return;
  const key = deviceKey.toLowerCase();
  if (!ctx.knownDeviceProfiles.has(key))
    ctx.knownDeviceProfiles.set(key, profileId);
  else if (ctx.knownDeviceProfiles.get(key) !== profileId) {
    // Device ownership is immutable. Conflicting evidence must not name a sender.
    ctx.knownDeviceProfiles.set(key, null);
  }
}

export function knownDeviceProfile(
  ctx: EngineContext,
  deviceKey: string
): string | null {
  const key = deviceKey.toLowerCase();
  const cached = ctx.directory.profileOf(key);
  if (cached) rememberDeviceProfile(ctx, key, cached);
  return ctx.knownDeviceProfiles.get(key) ?? null;
}

export async function profileOfLeaf(
  ctx: EngineContext,
  deviceKey: string
): Promise<string | null> {
  const key = deviceKey.toLowerCase();
  const known = knownDeviceProfile(ctx, key);
  if (known || ctx.knownDeviceProfiles.has(key)) return known;
  try {
    const record = await ctx.lookupReads.read(
      `device:${key}`,
      async (signal) => {
        const result = await ctx.api.getDevice(key, signal);
        if (result.device_key.toLowerCase() !== key || !result.profile_id) {
          throw new E2eeApiError({
            status: 404,
            message: "Device identity unavailable",
          });
        }
        return result;
      }
    );
    if (ctx.disposed) return null;
    ctx.directory.seed([record]);
    rememberDeviceProfile(ctx, key, record.profile_id);
    return knownDeviceProfile(ctx, key);
  } catch {
    // A readable message may outlive a failed identity read. Recover on sync/open.
    return null;
  }
}
