import { asE2eeApiError } from "../api";
import type { ApiE2eeDevice, ApiE2eeKeyPackageStatus } from "../api-types";
import { digestBytes, revokeDigest } from "../digests";
import {
  buildGrant,
  buildGrantTypedData,
  computeGrantId,
  credentialIdentity,
  E2EE_CIPHERSUITE,
} from "../grant";
import { MlsClient } from "../mls-adapter";
import type { StoredDevice } from "../records";
import type { E2eeDeviceInfo } from "../types";
import { loadDefaultWasm } from "../wasm-loader";
import {
  checkpoint,
  clearStoredState,
  DAY_MS,
  requireDevice,
  requireMls,
  type EngineContext,
} from "./context";
import { E2eeError } from "./errors";

/** Contract 2 + 8.8: one wallet prompt per device; KeyPackage pool upkeep. */

const ONE_TIME_POOL = 30;
const ONE_TIME_REFILL_BELOW = 10;
const MAX_ONE_TIME = 100;
const ONE_TIME_LIFETIME_S = 30 * 86_400;
const LAST_RESORT_LIFETIME_S = 90 * 86_400;
const LAST_RESORT_ROTATE_MS = 30 * DAY_MS;
/** Reuse a stored-but-unregistered grant only while it has this much left. */
const MIN_REUSABLE_GRANT_MS = 7 * DAY_MS;
/** 8.8: renewal is offered in the grant's last 14 days. */
const RENEWAL_WINDOW_MS = 14 * DAY_MS;

export const renewalDue = (ctx: EngineContext, device: StoredDevice): boolean =>
  device.grant.expires_at * 1000 - ctx.now() <= RENEWAL_WINDOW_MS;

export const grantExpired = (
  ctx: EngineContext,
  device: StoredDevice
): boolean => device.grant.expires_at * 1000 <= ctx.now();

/**
 * The stored device, unless it was granted under another ciphersuite (the
 * classical 0x0001 build, or an earlier value of the draft 0x004F code
 * point). Such a device cannot take part in groups on the current suite, so
 * its MLS state, groups and messages are dropped and it enrolls again.
 */
export async function loadCurrentSuiteDevice(
  ctx: EngineContext
): Promise<StoredDevice | null> {
  const stored = await ctx.storage.getDevice(ctx.profileId);
  if (stored && stored.grant.ciphersuite !== E2EE_CIPHERSUITE) {
    await clearStoredState(ctx);
    return null;
  }
  return stored;
}

export async function ensureWasm(ctx: EngineContext): Promise<void> {
  if (ctx.wasm) {
    return;
  }
  ctx.wasm = await (ctx.options.loadWasm ?? loadDefaultWasm)();
}

function reusablePending(
  ctx: EngineContext,
  device: StoredDevice | null
): boolean {
  return (
    device !== null &&
    !device.registered &&
    device.wallet.toLowerCase() === ctx.options.wallet.toLowerCase() &&
    device.grant.origin === ctx.options.origin &&
    device.grant.expires_at * 1000 - ctx.now() > MIN_REUSABLE_GRANT_MS
  );
}

async function signGrant(
  ctx: EngineContext,
  deviceKey: string
): Promise<{ grant: ReturnType<typeof buildGrant>; signature: string }> {
  const grant = buildGrant({
    wallet: ctx.options.wallet,
    deviceKey,
    issuedAtSeconds: Math.floor(ctx.now() / 1000),
    origin: ctx.options.origin,
  });
  try {
    const signature = await ctx.options.signTypedData(
      buildGrantTypedData(grant)
    );
    return { grant, signature: signature.toLowerCase() };
  } catch {
    throw new E2eeError("E2EE_SIGNATURE_REJECTED");
  }
}

const DEFAULT_DEVICE_LABEL = "Device";

/** The caller's coarse name for a new device ("Chrome on Windows"). */
const deviceLabel = (ctx: EngineContext): string => {
  const label = ctx.options.deviceLabel?.trim().slice(0, 48) ?? "";
  return label.length > 0 ? label : DEFAULT_DEVICE_LABEL;
};

/** Creates the device key and obtains the single wallet signature. */
async function createDevice(ctx: EngineContext): Promise<StoredDevice> {
  if (!ctx.wasm) {
    throw new E2eeError("E2EE_NOT_READY");
  }
  const mls = MlsClient.create(ctx.wasm);
  const deviceKey = mls.deviceKey();
  let signed: Awaited<ReturnType<typeof signGrant>>;
  try {
    signed = await signGrant(ctx, deviceKey);
  } catch (error) {
    mls.dispose();
    throw error;
  }
  const { grant, signature } = signed;
  ctx.mls?.dispose();
  ctx.mls = mls;
  const device: StoredDevice = {
    profileId: ctx.profileId,
    deviceKey,
    wallet: grant.wallet,
    grant,
    grantId: computeGrantId(grant),
    walletSignature: signature,
    registered: false,
    provisioned: false,
    label: deviceLabel(ctx),
    platform: ctx.options.platform,
    createdAt: ctx.now(),
    lastResortAt: null,
  };
  ctx.device = device;
  await checkpoint(ctx, { device });
  return device;
}

async function uploadKeyPackages(
  ctx: EngineContext,
  count: number,
  lastResort: boolean
): Promise<ApiE2eeKeyPackageStatus> {
  const mls = requireMls(ctx);
  const device = requireDevice(ctx);
  const packages = mls.createKeyPackages(
    count,
    lastResort,
    lastResort ? LAST_RESORT_LIFETIME_S : ONE_TIME_LIFETIME_S
  );
  // Persist the private halves BEFORE the public halves leave the device.
  await checkpoint(ctx);
  const status = await ctx.api.uploadKeyPackages(device.deviceKey, {
    key_packages: packages.map((item) => ({
      data: item.data,
      last_resort: lastResort,
      expires_at: item.expires_at,
    })),
  });
  if (lastResort) {
    device.lastResortAt = ctx.now();
    await checkpoint(ctx, { device, skipWasm: true });
  }
  return status;
}

/** Refills one-time KeyPackages below 10 and rotates the last-resort one. */
async function ensureKeyPackages(
  ctx: EngineContext,
  status: ApiE2eeKeyPackageStatus | null
): Promise<void> {
  const device = requireDevice(ctx);
  const available = status?.one_time_available ?? 0;
  if (available < ONE_TIME_REFILL_BELOW) {
    const count = Math.min(ONE_TIME_POOL - available, MAX_ONE_TIME - available);
    if (count > 0) {
      await uploadKeyPackages(ctx, count, false);
    }
  }
  const lastResortMissing =
    status?.last_resort_expires_at === null || status === null;
  const lastResortStale =
    device.lastResortAt === null ||
    ctx.now() - device.lastResortAt >= LAST_RESORT_ROTATE_MS;
  if (lastResortMissing || lastResortStale) {
    await uploadKeyPackages(ctx, 1, true);
  }
}

/** A pending device enrolled by a combined sign-in grant (NC8). */
export const hasLoginGrant = (
  device: StoredDevice | null
): device is StoredDevice & { loginGrantId: string } =>
  typeof device?.loginGrantId === "string";

const submitRegistration = async (
  ctx: EngineContext,
  device: StoredDevice
): Promise<ApiE2eeDevice> => {
  if (!hasLoginGrant(device)) {
    return await ctx.api.registerDevice({
      grant: device.grant,
      wallet_signature: device.walletSignature,
      label: device.label,
      platform: device.platform,
    });
  }
  // The sign-in flow stores the key before the engine knows this browser's
  // name; name it now, as a device enrolled with the grant prompt would be.
  if (device.label === DEFAULT_DEVICE_LABEL) {
    device.label = deviceLabel(ctx);
  }
  try {
    return await ctx.api.registerLoginGrantDevice({
      grant_id: device.loginGrantId,
      label: device.label,
      platform: device.platform,
    });
  } catch (error) {
    const apiError = asE2eeApiError(error);
    // The server cannot use the sign-in grant (revoked, expired, another
    // ciphersuite, or a server without the route): fall back to the separate
    // grant prompt with a fresh device.
    if (
      apiError?.code === "E2EE_BAD_GRANT" ||
      apiError?.code === "E2EE_DEVICE_EXISTS" ||
      (apiError?.status === 404 && apiError.code !== "E2EE_DISABLED")
    ) {
      throw new E2eeError(
        "E2EE_LOGIN_GRANT_REJECTED",
        apiError.code ?? undefined
      );
    }
    throw error;
  }
};

async function register(
  ctx: EngineContext,
  device: StoredDevice
): Promise<boolean> {
  try {
    const record = await submitRegistration(ctx, device);
    ctx.directory.seed([record]);
  } catch (error) {
    if (asE2eeApiError(error)?.code === "E2EE_DEVICE_LIMIT") {
      ctx.store.status = "device-limit";
      ctx.store.touch();
      return false;
    }
    throw error;
  }
  device.registered = true;
  await checkpoint(ctx, { device, skipWasm: true });
  return true;
}

async function provision(
  ctx: EngineContext,
  device: StoredDevice
): Promise<void> {
  const mls = requireMls(ctx);
  if (mls.credentialIdentity() === null) {
    mls.setCredential(credentialIdentity(device.wallet, device.grantId));
    await checkpoint(ctx);
  }
  await ensureKeyPackages(ctx, null);
  device.provisioned = true;
  await checkpoint(ctx, { device, skipWasm: true });
}

/**
 * 8.8 renewal: one new signature for the same device key; the server
 * updates the grant, the MLS credential is replaced (groups pick it up with
 * a self-update) and fresh KeyPackages carry the new credential.
 */
export async function renewGrant(ctx: EngineContext): Promise<void> {
  const device = requireDevice(ctx);
  const mls = requireMls(ctx);
  const { grant, signature } = await signGrant(ctx, device.deviceKey);
  const record = await ctx.api.registerDevice({
    grant,
    wallet_signature: signature,
    label: device.label,
    platform: device.platform,
  });
  ctx.directory.seed([record]);
  device.wallet = grant.wallet;
  device.grant = grant;
  device.grantId = computeGrantId(grant);
  device.walletSignature = signature;
  delete device.loginGrantId;
  mls.setCredential(credentialIdentity(device.wallet, device.grantId));
  await checkpoint(ctx, { device });
  await uploadKeyPackages(ctx, ONE_TIME_POOL, false);
  await uploadKeyPackages(ctx, 1, true);
}

/** Forgets a pending device whose grant the server will not accept. */
async function discardPendingDevice(ctx: EngineContext): Promise<void> {
  ctx.mls?.dispose();
  ctx.mls = null;
  ctx.device = null;
  ctx.lastState = null;
  await clearStoredState(ctx);
}

const isLoginGrantRejection = (error: unknown): boolean =>
  error instanceof E2eeError && error.code === "E2EE_LOGIN_GRANT_REJECTED";

/**
 * Registers a pending device. When the server refuses a combined sign-in
 * grant (NC8), the device is dropped and, if a prompt is allowed, a fresh one
 * enrolls with the separate grant signature; otherwise the rejection is
 * rethrown for the caller to fall back later.
 */
async function registerPending(
  ctx: EngineContext,
  device: StoredDevice,
  allowPrompt: boolean
): Promise<StoredDevice | null> {
  try {
    return (await register(ctx, device)) ? device : null;
  } catch (error) {
    if (!isLoginGrantRejection(error)) {
      throw error;
    }
    await discardPendingDevice(ctx);
    if (!allowPrompt) {
      throw error;
    }
    const fresh = await createDevice(ctx);
    return (await register(ctx, fresh)) ? fresh : null;
  }
}

/**
 * Enrollment: device key in WASM, ONE signTypedData, register, credential,
 * KeyPackages. Resumable: a stored grant is reused instead of re-prompting,
 * including the MLS key a combined sign-in grant already granted (NC8), which
 * needs no prompt at all. `allowPrompt: false` never asks the wallet.
 * Returns true when the device is ready. Runs inside the queue.
 */
export async function enrollDevice(
  ctx: EngineContext,
  { allowPrompt = true }: { readonly allowPrompt?: boolean } = {}
): Promise<boolean> {
  await ensureWasm(ctx);
  const stored = await loadCurrentSuiteDevice(ctx);
  let device: StoredDevice;
  if (stored && (stored.registered || reusablePending(ctx, stored))) {
    device = stored;
    if (!ctx.mls) {
      const state = await ctx.storage.getWasmState(ctx.profileId);
      if (!state || !ctx.wasm) {
        throw new E2eeError("E2EE_NOT_READY", "missing device state");
      }
      ctx.mls = MlsClient.load(ctx.wasm, state);
      ctx.lastState = state;
    }
    ctx.device = device;
  } else if (allowPrompt) {
    device = await createDevice(ctx);
  } else {
    return false;
  }
  if (!device.registered) {
    const registered = await registerPending(ctx, device, allowPrompt);
    if (!registered) {
      return false;
    }
    device = registered;
  }
  if (!device.provisioned) {
    await provision(ctx, device);
  } else if (renewalDue(ctx, device)) {
    await renewGrant(ctx);
  }
  return true;
}

function toDeviceInfo(
  ctx: EngineContext,
  record: ApiE2eeDevice,
  verified: boolean
): E2eeDeviceInfo {
  const own = record.device_key.toLowerCase() === ctx.device?.deviceKey;
  const platform =
    record.platform === "desktop" || record.platform === "phone"
      ? record.platform
      : "web";
  return {
    deviceKey: record.device_key.toLowerCase(),
    label: own && ctx.device ? ctx.device.label : record.label,
    platform,
    createdAt: record.created_at,
    lastSeenAt: record.last_seen_at,
    expiresAt: record.grant.expires_at * 1000,
    revokedAt: record.revoked_at,
    isThisDevice: own,
    verified,
  };
}

/** Refreshes the device list and KeyPackage pool from GET /e2ee/me. */
export async function refreshMe(
  ctx: EngineContext
): Promise<{ ownRevoked: boolean }> {
  const me = await ctx.api.getMe();
  ctx.lastMeAt = ctx.now();
  ctx.directory.seed(me.devices);
  const infos: E2eeDeviceInfo[] = [];
  for (const record of me.devices) {
    const verification = await ctx.directory.verify(record);
    infos.push(toDeviceInfo(ctx, record, verification.verified));
  }
  ctx.store.devices = infos;
  ctx.store.attachmentsEnabled = me.attachments_enabled !== false;
  const ownKey = ctx.device?.deviceKey;
  const own = me.devices.find(
    (record) => record.device_key.toLowerCase() === ownKey
  );
  ctx.store.thisDevice = infos.find((info) => info.isThisDevice) ?? null;
  ctx.store.touch();
  if (ctx.device?.registered === true && own?.revoked_at !== null) {
    return { ownRevoked: true };
  }
  if (ctx.device?.provisioned) {
    const status = me.key_packages.find(
      (item) => item.device_key.toLowerCase() === ownKey
    );
    await ctx.queue.run(() => ensureKeyPackages(ctx, status ?? null));
  }
  return { ownRevoked: false };
}

/** Signs and submits a revocation (2.4) with this device's MLS key. */
export async function submitRevocation(
  ctx: EngineContext,
  target: string
): Promise<ApiE2eeDevice> {
  const mls = requireMls(ctx);
  const device = requireDevice(ctx);
  const revokedAt = Math.floor(ctx.now() / 1000);
  const digest = revokeDigest(target, device.deviceKey, revokedAt);
  const signature = mls.signDigest(digestBytes(digest));
  const record = await ctx.api.revokeDevice(target, {
    revoker_device_key: device.deviceKey,
    revoked_at: revokedAt,
    signature,
  });
  ctx.directory.seed([record]);
  return record;
}
