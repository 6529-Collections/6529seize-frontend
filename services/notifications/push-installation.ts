import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { commonApiPost } from "@/services/api/common-api";
import {
  getConnectedWalletAccounts,
  getAuthJwt,
  isAuthJwtUsable,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getNativeRefreshToken } from "@/services/auth/native-refresh-token-storage";
import { getPushDeviceIdentity } from "@/components/notifications/stable-device-id";
import { getDeliveredNotificationProfileId } from "@/components/notifications/delivered-notification-data";
import type { ApiRevokePushInstallationRequest } from "@/generated/models/ApiRevokePushInstallationRequest";
import type { ApiRefreshPushInstallationBadgeRequest } from "@/generated/models/ApiRefreshPushInstallationBadgeRequest";

import { isConnectedPushAuth } from "./connected-push-profiles";

const STORAGE_KEY = "push-installation-lifecycle-v1";
const secretSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const revisionSchema = z.number().int().min(0).max(4294967295);
const installationSchema = z
  .object({
    deviceId: z.string().min(1).max(100),
    secret: secretSchema,
    revision: revisionSchema,
    token: z.string().optional(),
    previousDeviceId: z.string().optional(),
    migrationQueued: z.boolean().optional(),
    blockedAuth: z.array(z.string()),
    pending: z.array(
      z.object({
        device_id: z.string().min(1).max(100),
        installation_secret: secretSchema,
        revision: revisionSchema.min(1),
        token: z.string().optional(),
        profile_id: z.string().optional(),
        all_profiles: z.boolean(),
        token_scoped: z.boolean().optional(),
        sessions: z.array(
          z.object({ address: z.string(), native_refresh_token: z.string() })
        ),
      })
    ),
  })
  .refine((state) =>
    state.pending.every(
      (job) =>
        job.device_id !== state.deviceId ||
        (job.installation_secret === state.secret &&
          job.revision <= state.revision)
    )
  );
interface InstallationState {
  deviceId: string;
  secret: string;
  revision: number;
  token?: string;
  previousDeviceId?: string;
  migrationQueued?: boolean;
  blockedAuth: string[];
  pending: ApiRevokePushInstallationRequest[];
}
let stateWork: Promise<unknown> = Promise.resolve();
let flushWork: Promise<boolean> | undefined;

function serialized<T>(action: () => Promise<T>): Promise<T> {
  const result = stateWork.then(action, action);
  stateWork = result.catch(() => undefined);
  return result;
}
const newSecret = () => (uuidv4() + uuidv4()).replaceAll("-", "");
async function readState(): Promise<InstallationState> {
  const identity = await getPushDeviceIdentity();
  let state: InstallationState;
  try {
    const stored = await SecureStoragePlugin.get({ key: STORAGE_KEY });
    const parsed = installationSchema.safeParse(JSON.parse(stored.value));
    if (!parsed.success) throw new Error("Invalid push installation storage");
    state = parsed.data as InstallationState;
  } catch (error) {
    // Do not replace a damaged/unreadable existing credential or discard its outbox.
    const message = error instanceof Error ? error.message : String(error);
    if (!/item with given key does not exist|not found/i.test(message))
      throw error;
    state = {
      deviceId: identity.deviceId,
      ...(identity.previousDeviceId
        ? { previousDeviceId: identity.previousDeviceId }
        : {}),
      secret: newSecret(),
      revision: 0,
      blockedAuth: [],
      pending: [],
    };
    await writeState(state);
  }
  if (state.deviceId !== identity.deviceId) {
    state = {
      deviceId: identity.deviceId,
      previousDeviceId: state.deviceId,
      secret: newSecret(),
      revision: 0,
      blockedAuth: state.blockedAuth,
      // Preserve original jobs and their credentials/revisions verbatim. They
      // belong to an older namespace and cannot delete this installation.
      pending: state.pending,
    };
    await writeState(state);
  }
  return state;
}
async function writeState(state: InstallationState) {
  await SecureStoragePlugin.set({
    key: STORAGE_KEY,
    value: JSON.stringify(state),
  });
}

export async function preparePushInstallationRegistration(
  deviceId: string,
  token: string,
  authJwt: string,
  connectedProfileId?: string
) {
  const credential = await serialized(async () => {
    const state = await readState();
    if (state.deviceId !== deviceId)
      throw new Error("Push installation ID changed");
    if (state.blockedAuth.includes(getAuthTokenFingerprint(authJwt)))
      throw new Error("Push registration belongs to a signed-out session");
    state.token = token;
    // An immediate logout may precede the first native token callback.
    state.pending = state.pending.map((job) =>
      job.device_id === state.deviceId && !job.token ? { ...job, token } : job
    );
    await writeState(state);
    return {
      installation_secret: state.secret,
      installation_revision: state.revision,
      ...(state.previousDeviceId
        ? { previous_device_id: state.previousDeviceId }
        : {}),
    };
  });
  await flushPendingPushLogouts();
  // Do not register while an older revocation is still pending or auth changed.
  const ready = await serialized(async () => {
    const state = await readState();
    return (
      !state.pending.some((job) => job.device_id === state.deviceId) &&
      state.secret === credential.installation_secret &&
      state.deviceId === deviceId &&
      state.revision === credential.installation_revision &&
      (connectedProfileId
        ? isConnectedPushAuth(authJwt, connectedProfileId)
        : getAuthJwt() === authJwt) &&
      !state.blockedAuth.includes(getAuthTokenFingerprint(authJwt))
    );
  });
  if (!ready)
    throw new Error(
      "Push registration deferred until logout reconciliation completes"
    );
  return credential;
}

/** Read proof without changing registration, logout jobs, or notification state. */
export function getPushInstallationBadgeRefreshRequest(
  deviceId: string,
  token: string,
  authKey: string
): Promise<ApiRefreshPushInstallationBadgeRequest | null> {
  return serialized(async () => {
    const state = await readState();
    const jwt = getAuthJwt();
    if (
      !isAuthJwtUsable(jwt) ||
      getAuthTokenFingerprint(jwt) !== authKey ||
      state.deviceId !== deviceId ||
      state.token !== token ||
      state.blockedAuth.includes(authKey) ||
      state.pending.some((job) => job.device_id === deviceId)
    )
      return null;
    return {
      device_id: deviceId,
      installation_secret: state.secret,
      revision: state.revision,
    };
  });
}

/** Called only after every currently connected profile registered its current token. */
export async function completePushInstallationMigration(
  deviceId: string,
  token: string
): Promise<boolean> {
  const job = await serialized(async () => {
    const state = await readState();
    if (
      state.deviceId !== deviceId ||
      state.token !== token ||
      !state.previousDeviceId
    )
      return;
    if (state.migrationQueued)
      return state.pending.find(
        (item) => item.token_scoped && item.device_id === state.previousDeviceId
      );
    const cleanup: ApiRevokePushInstallationRequest = {
      device_id: state.previousDeviceId,
      installation_secret: newSecret(),
      revision: 1,
      token,
      token_scoped: true,
      all_profiles: true,
      sessions: [],
    };
    state.pending.push(cleanup);
    state.migrationQueued = true;
    await writeState(state);
    return cleanup;
  });
  if (!job) return false;
  await flushPendingPushLogouts();
  return serialized(
    async () =>
      !(await readState()).pending.some(
        (item) => jobNamespace(item) === jobNamespace(job)
      )
  );
}

/** Persist only a revocation request in secure storage before removing active credentials. */
export async function queueNativePushLogout(
  address: string | null,
  allProfiles: boolean
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const accounts = getConnectedWalletAccounts();
  const selected = allProfiles
    ? accounts
    : accounts.filter(
        (account) => account.address.toLowerCase() === address?.toLowerCase()
      );
  const selectedProfileId = selected[0]?.profileId;
  const profileId =
    !allProfiles &&
    accounts.some(
      (account) =>
        account.address.toLowerCase() !== address?.toLowerCase() &&
        account.profileId === selectedProfileId
    )
      ? undefined
      : selectedProfileId;
  const legacyAddress = address ?? getWalletAddress();
  const fallbackAccounts = legacyAddress ? [{ address: legacyAddress }] : [];
  const sessionAccounts = selected.length ? selected : fallbackAccounts;
  const sessions = (
    await Promise.all(
      sessionAccounts.map(async (account) => {
        const token = await getNativeRefreshToken(account.address);
        return token
          ? { address: account.address, native_refresh_token: token }
          : null;
      })
    )
  ).filter((session) => session !== null);
  await serialized(async () => {
    const state = await readState();
    if (state.revision === 4294967295)
      throw new Error("Push installation revision exhausted");
    state.revision += 1;
    state.blockedAuth = [
      ...new Set([
        ...state.blockedAuth,
        ...selected.flatMap((account) =>
          account.jwt ? [getAuthTokenFingerprint(account.jwt)] : []
        ),
      ]),
    ];
    state.pending.push({
      device_id: state.deviceId,
      installation_secret: state.secret,
      revision: state.revision,
      ...(state.token ? { token: state.token } : {}),
      all_profiles: allProfiles,
      ...(!allProfiles && profileId ? { profile_id: profileId } : {}),
      sessions,
    });
    await writeState(state);
  });
  // Native tray cleanup is local to the explicit sign-out action. Never replay
  // a global tray clear later, when the user may have connected new profiles.
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    if (allProfiles) await PushNotifications.removeAllDeliveredNotifications();
    else if (profileId) {
      const delivered = await PushNotifications.getDeliveredNotifications();
      const notifications = delivered.notifications.filter(
        (item) => getDeliveredNotificationProfileId(item) === profileId
      );
      if (notifications.length)
        await PushNotifications.removeDeliveredNotifications({ notifications });
    }
  } catch {
    /* Backend revocation remains queued even if native cleanup fails. */
  }
  void flushPendingPushLogouts();
}

async function sendPushLogout(
  job: ApiRevokePushInstallationRequest
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    await commonApiPost<ApiRevokePushInstallationRequest, unknown>({
      endpoint: "push-notifications/installations/revoke",
      body: job,
      includeWalletAuth: false,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function jobNamespace(job: ApiRevokePushInstallationRequest): string {
  // Legacy logout and migration cleanup can share a device ID and revision;
  // only the credential namespace plus revision identifies an acknowledgement.
  return `${job.device_id}:${job.installation_secret}`;
}
async function drainPushLogouts(): Promise<boolean> {
  let reconciled = false;
  const failed = new Set<string>();
  for (;;) {
    const job = await serialized(async () => {
      const state = await readState();
      const available = state.pending.filter(
        (item) => !failed.has(jobNamespace(item))
      );
      // Current-device logout must not wait behind an unreachable old phone.
      return (
        available.find((item) => item.device_id === state.deviceId) ??
        available[0]
      );
    });
    if (!job) return reconciled;
    try {
      await sendPushLogout(job);
    } catch {
      // Preserve order within each installation/credential, but continue work
      // in independent namespaces. Failure never discards deletion proof.
      failed.add(jobNamespace(job));
      continue;
    }
    await serialized(async () => {
      const state = await readState();
      state.pending = state.pending.filter(
        (pending) =>
          jobNamespace(pending) !== jobNamespace(job) ||
          pending.revision !== job.revision
      );
      await writeState(state);
    });
    reconciled = true;
  }
}
export function flushPendingPushLogouts(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(false);
  flushWork ??= drainPushLogouts()
    .catch(() => false)
    .finally(() => {
      flushWork = undefined;
    });
  return flushWork;
}
