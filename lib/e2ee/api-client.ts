import type { ApiE2eeDeviceInboxStatus } from "@/generated/models/ApiE2eeDeviceInboxStatus";
import type { E2eeApiClient } from "./api";
import type { ApiE2eeBlob, ApiE2eeMe } from "./api-types";

interface E2eeRequestTransport {
  get: <T>(
    endpoint: string,
    params?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<T>;
  post: <T>(endpoint: string, body: object, signal?: AbortSignal) => Promise<T>;
  put: <T>(endpoint: string, body: object) => Promise<T>;
}
const enc = encodeURIComponent;
const HASH = /^0x[0-9a-f]{64}$/u;

/** The inbox head 6529.io names while records are on, if well formed. */
function relayHeadOf(
  value: unknown
): { readonly pos: number; readonly hash: string } | null {
  if (typeof value !== "object" || value === null) return null;
  const { pos, hash } = value as Record<string, unknown>;
  if (typeof pos !== "number" || !Number.isSafeInteger(pos) || pos < 1) {
    return null;
  }
  if (typeof hash !== "string" || !HASH.test(hash.toLowerCase())) return null;
  return { pos, hash: hash.toLowerCase() };
}

/** Endpoint mapping shared with the staging QA transport. Account checks stay in requests(). */
export function buildE2eeApiClient({
  get,
  post,
  put,
}: E2eeRequestTransport): E2eeApiClient {
  return {
    renameDevice: (deviceKey, name) =>
      post(`e2ee/devices/${enc(deviceKey)}/label`, { label: name }),
    getMe: () => get<ApiE2eeMe>("e2ee/me"),
    registerDevice: (body) => post(`e2ee/devices`, body),
    registerLoginGrantDevice: (body) => post(`e2ee/devices/login-grant`, body),
    getDevice: (deviceKey, signal) =>
      get(`e2ee/devices/${enc(deviceKey)}`, undefined, signal),
    getProfileDevices: (profileId, ciphersuite) =>
      get(
        `e2ee/profiles/${enc(profileId)}/devices`,
        ciphersuite === undefined
          ? undefined
          : { ciphersuite: String(ciphersuite) }
      ),
    revokeDevice: (deviceKey, body) =>
      post(`e2ee/devices/${enc(deviceKey)}/revoke`, body),
    uploadKeyPackages: (deviceKey, body) =>
      post(`e2ee/devices/${enc(deviceKey)}/key-packages`, body),
    claimKeyPackages: (body) => post(`e2ee/key-packages/claim`, body),
    checkEligibility: (body) => post(`e2ee/eligibility`, body),
    createGroup: (body) => post(`e2ee/groups`, body),
    getGroup: (group, deviceKey) =>
      get(`e2ee/groups/${enc(group)}`, { device_key: deviceKey }),
    submitEntry: (group, body) =>
      post(`e2ee/groups/${enc(group)}/entries`, body),
    getLog: (group, query) =>
      get(`e2ee/groups/${enc(group)}/log`, {
        device_key: query.deviceKey,
        after_seq: String(query.afterSeq),
        limit: String(query.limit ?? 100),
      }),
    sendMessage: (group, body) =>
      post(`e2ee/groups/${enc(group)}/messages`, body),
    repairRoster: (group, body) =>
      post(`e2ee/groups/${enc(group)}/roster`, body),
    getWelcomes: (deviceKey, signal) =>
      get(`e2ee/devices/${enc(deviceKey)}/welcomes`, undefined, signal),
    ackWelcome: async (deviceKey, welcomeId, signal) => {
      await post<unknown>(
        `e2ee/devices/${enc(deviceKey)}/welcomes/${enc(welcomeId)}/ack`,
        {},
        signal
      );
    },
    getDeviceGroups: (deviceKey, signal) =>
      get(`e2ee/devices/${enc(deviceKey)}/groups`, undefined, signal),
    getDeviceInboxStatus: async (deviceKey, signal) => {
      const status = await get<
        (Partial<ApiE2eeDeviceInboxStatus> & { relay_head?: unknown }) | null
      >(`e2ee/devices/${enc(deviceKey)}/inbox-status`, undefined, signal);
      const queued = status?.has_queued_welcomes;
      if (
        typeof status?.has_pending_chats !== "boolean" ||
        (queued !== undefined && typeof queued !== "boolean")
      ) {
        throw new TypeError("Invalid encrypted inbox status");
      }
      const head = relayHeadOf(status.relay_head);
      return {
        has_pending_chats: status.has_pending_chats,
        ...(queued === undefined ? {} : { has_queued_welcomes: queued }),
        ...(head ? { relay_head: head } : {}),
      };
    },
    createBlob: (body) => post(`e2ee/blobs`, body),
    putBlobChunk: (blobId, index, body) =>
      put(`e2ee/blobs/${enc(blobId)}/chunks/${index}`, body),
    completeBlob: (blobId) =>
      post<ApiE2eeBlob>(`e2ee/blobs/${enc(blobId)}/complete`, {}),
    getBlobChunk: (blobId, index, deviceKey, signal) =>
      get(
        `e2ee/blobs/${enc(blobId)}/chunks/${index}`,
        {
          device_key: deviceKey,
        },
        signal
      ),
    report: (body) => post(`e2ee/reports`, body),
  };
}
