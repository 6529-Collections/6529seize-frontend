import type { E2eeApiClient } from "./api";
import type { ApiE2eeBlob, ApiE2eeMe } from "./api-types";

interface E2eeRequestTransport {
  get: <T>(
    endpoint: string,
    params?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<T>;
  post: <T>(endpoint: string, body: object) => Promise<T>;
  put: <T>(endpoint: string, body: object) => Promise<T>;
}
const enc = encodeURIComponent;

/** Endpoint mapping shared with the staging QA transport. Account checks stay in requests(). */
export function buildE2eeApiClient({
  get,
  post,
  put,
}: E2eeRequestTransport): E2eeApiClient {
  return {
    getMe: () => get<ApiE2eeMe>("e2ee/me"),
    registerDevice: (body) => post(`e2ee/devices`, body),
    registerLoginGrantDevice: (body) => post(`e2ee/devices/login-grant`, body),
    getDevice: (deviceKey) => get(`e2ee/devices/${enc(deviceKey)}`),
    getProfileDevices: (profileId) =>
      get(`e2ee/profiles/${enc(profileId)}/devices`),
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
    getWelcomes: (deviceKey) => get(`e2ee/devices/${enc(deviceKey)}/welcomes`),
    ackWelcome: async (deviceKey, welcomeId) => {
      await post<unknown>(
        `e2ee/devices/${enc(deviceKey)}/welcomes/${enc(welcomeId)}/ack`,
        {}
      );
    },
    getDeviceGroups: (deviceKey) =>
      get(`e2ee/devices/${enc(deviceKey)}/groups`),
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
