import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { commonApiPost } from "@/services/api/common-api";
import {
  getConnectedWalletAccounts,
  getAuthJwt,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getNativeRefreshToken } from "@/services/auth/native-refresh-token-storage";
import { getStableDeviceId } from "@/components/notifications/stable-device-id";
import { getDeliveredNotificationProfileId } from "@/components/notifications/delivered-notification-data";
import type { ApiRevokePushInstallationRequest } from "@/generated/models/ApiRevokePushInstallationRequest";

const STORAGE_KEY = "push-installation-lifecycle-v1";
const secretSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const revisionSchema = z.number().int().min(0).max(4294967295);
const installationSchema = z
  .object({
    deviceId: z.string().min(1).max(100),
    secret: secretSchema,
    revision: revisionSchema,
    token: z.string().optional(),
    blockedAuth: z.array(z.string()),
    pending: z.array(
      z.object({
        device_id: z.string().min(1).max(100),
        installation_secret: secretSchema,
        revision: revisionSchema.min(1),
        token: z.string().optional(),
        profile_id: z.string().optional(),
        all_profiles: z.boolean(),
        sessions: z.array(
          z.object({ address: z.string(), native_refresh_token: z.string() })
        ),
      })
    ),
  })
  .refine((state) =>
    state.pending.every(
      (job) =>
        job.device_id === state.deviceId &&
        job.installation_secret === state.secret &&
        job.revision <= state.revision
    )
  );
interface InstallationState {
  deviceId: string;
  secret: string;
  revision: number;
  token?: string;
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
async function readState(): Promise<InstallationState> {
  try {
    const stored = await SecureStoragePlugin.get({ key: STORAGE_KEY });
    const parsed = installationSchema.safeParse(JSON.parse(stored.value));
    if (!parsed.success) throw new Error("Invalid push installation storage");
    return parsed.data as InstallationState;
  } catch (error) {
    // Do not replace a damaged/unreadable existing credential or discard its outbox.
    const message = error instanceof Error ? error.message : String(error);
    if (!/item with given key does not exist|not found/i.test(message))
      throw error;
    const state: InstallationState = {
      deviceId: await getStableDeviceId(),
      secret: (uuidv4() + uuidv4()).replaceAll("-", ""),
      revision: 0,
      blockedAuth: [],
      pending: [],
    };
    await writeState(state);
    return state;
  }
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
  authJwt: string
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
      job.token ? job : { ...job, token }
    );
    await writeState(state);
    return {
      installation_secret: state.secret,
      installation_revision: state.revision,
    };
  });
  await flushPendingPushLogouts();
  // Do not register while an older revocation is still pending or auth changed.
  const ready = await serialized(async () => {
    const state = await readState();
    return (
      !state.pending.length &&
      state.revision === credential.installation_revision &&
      getAuthJwt() === authJwt &&
      !state.blockedAuth.includes(getAuthTokenFingerprint(authJwt))
    );
  });
  if (!ready)
    throw new Error(
      "Push registration deferred until logout reconciliation completes"
    );
  return credential;
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

async function drainPushLogouts(): Promise<boolean> {
  let reconciled = false;
  for (;;) {
    const job = await serialized(async () => (await readState()).pending[0]);
    if (!job) return reconciled;
    try {
      await commonApiPost<ApiRevokePushInstallationRequest, unknown>({
        endpoint: "push-notifications/installations/revoke",
        body: job,
        includeWalletAuth: false,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      // Retry on app activation/reconnect and before any new registration.
      return reconciled;
    }
    await serialized(async () => {
      const state = await readState();
      state.pending = state.pending.filter(
        (pending) => pending.revision !== job.revision
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
