import {
  commonApiFetch,
  commonApiPost,
  commonApiPut,
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
import type {
  ApiE2eeBlob,
  ApiE2eeBlobChunk,
  ApiE2eeClaimKeyPackagesRequest,
  ApiE2eeClaimKeyPackagesResponse,
  ApiE2eeCreateBlobRequest,
  ApiE2eeCreateGroupRequest,
  ApiE2eeDevice,
  ApiE2eeDeviceGroup,
  ApiE2eeEligibilityRequest,
  ApiE2eeEligibilityResponse,
  ApiE2eeGroup,
  ApiE2eeKeyPackageStatus,
  ApiE2eeLogItem,
  ApiE2eeLogPage,
  ApiE2eeMe,
  ApiE2eeRegisterDeviceRequest,
  ApiE2eeRegisterLoginGrantDeviceRequest,
  ApiE2eeReport,
  ApiE2eeReportRequest,
  ApiE2eeRevokeDeviceRequest,
  ApiE2eeRosterRepairRequest,
  ApiE2eeSendMessageRequest,
  ApiE2eeSendMessageResponse,
  ApiE2eeSubmitEntryRequest,
  ApiE2eeUploadKeyPackagesRequest,
  ApiE2eeWelcome,
} from "./api-types";

/**
 * Typed REST error. `status` 0 means the request never produced an HTTP
 * response (network failure); the outcome of a write is then unknown.
 */
export class E2eeApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly currentEpoch: number | null;

  constructor(input: {
    message: string;
    status: number;
    code?: string | null;
    currentEpoch?: number | null;
  }) {
    super(input.message);
    this.name = "E2eeApiError";
    this.status = input.status;
    this.code = input.code ?? null;
    this.currentEpoch = input.currentEpoch ?? null;
  }
}

interface ErrorShape {
  readonly name?: unknown;
  readonly status?: unknown;
  readonly code?: unknown;
  readonly currentEpoch?: unknown;
}

/** Duck-typed so test doubles (and errors crossing realms) qualify. */
export function asE2eeApiError(error: unknown): E2eeApiError | null {
  if (error instanceof E2eeApiError) {
    return error;
  }
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const shape = error as ErrorShape;
  if (shape.name !== "E2eeApiError" || typeof shape.status !== "number") {
    return null;
  }
  return new E2eeApiError({
    message: error instanceof Error ? error.message : "E2EE API error",
    status: shape.status,
    code: typeof shape.code === "string" ? shape.code : null,
    currentEpoch:
      typeof shape.currentEpoch === "number" ? shape.currentEpoch : null,
  });
}

export const e2eeErrorCode = (error: unknown): string | null =>
  asE2eeApiError(error)?.code ?? null;

/** Contract 4.2: every endpoint the engine uses. Tests inject a fake. */
export interface E2eeApiClient {
  getMe(): Promise<ApiE2eeMe>;
  registerDevice(body: ApiE2eeRegisterDeviceRequest): Promise<ApiE2eeDevice>;
  registerLoginGrantDevice(
    body: ApiE2eeRegisterLoginGrantDeviceRequest
  ): Promise<ApiE2eeDevice>;
  getDevice(deviceKey: string): Promise<ApiE2eeDevice>;
  getProfileDevices(profileId: string): Promise<ApiE2eeDevice[]>;
  revokeDevice(
    deviceKey: string,
    body: ApiE2eeRevokeDeviceRequest
  ): Promise<ApiE2eeDevice>;
  uploadKeyPackages(
    deviceKey: string,
    body: ApiE2eeUploadKeyPackagesRequest
  ): Promise<ApiE2eeKeyPackageStatus>;
  claimKeyPackages(
    body: ApiE2eeClaimKeyPackagesRequest
  ): Promise<ApiE2eeClaimKeyPackagesResponse>;
  checkEligibility(
    body: ApiE2eeEligibilityRequest
  ): Promise<ApiE2eeEligibilityResponse>;
  createGroup(body: ApiE2eeCreateGroupRequest): Promise<ApiE2eeGroup>;
  getGroup(group: string, deviceKey: string): Promise<ApiE2eeGroup>;
  submitEntry(
    group: string,
    body: ApiE2eeSubmitEntryRequest
  ): Promise<ApiE2eeLogItem>;
  getLog(
    group: string,
    query: { deviceKey: string; afterSeq: number; limit?: number }
  ): Promise<ApiE2eeLogPage>;
  sendMessage(
    group: string,
    body: ApiE2eeSendMessageRequest
  ): Promise<ApiE2eeSendMessageResponse>;
  repairRoster(
    group: string,
    body: ApiE2eeRosterRepairRequest
  ): Promise<ApiE2eeGroup>;
  getWelcomes(deviceKey: string): Promise<ApiE2eeWelcome[]>;
  ackWelcome(deviceKey: string, welcomeId: string): Promise<void>;
  getDeviceGroups(deviceKey: string): Promise<ApiE2eeDeviceGroup[]>;
  createBlob(body: ApiE2eeCreateBlobRequest): Promise<ApiE2eeBlob>;
  putBlobChunk(
    blobId: string,
    index: number,
    body: ApiE2eeBlobChunk
  ): Promise<ApiE2eeBlob>;
  completeBlob(blobId: string): Promise<ApiE2eeBlob>;
  getBlobChunk(
    blobId: string,
    index: number,
    deviceKey: string
  ): Promise<ApiE2eeBlobChunk>;
  report(body: ApiE2eeReportRequest): Promise<ApiE2eeReport>;
}

const readCurrentEpoch = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }
  const response = (error as { readonly response?: { body?: unknown } })
    .response;
  let body = response?.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const epoch = (body as { readonly current_epoch?: unknown }).current_epoch;
  return typeof epoch === "number" ? epoch : null;
};

export function toE2eeApiError(error: unknown): unknown {
  if (error instanceof DOMException && error.name === "AbortError") {
    return error;
  }
  const existing = asE2eeApiError(error);
  if (existing) {
    return existing;
  }
  const status = getStructuredApiErrorStatus(error);
  return new E2eeApiError({
    message: error instanceof Error ? error.message : "E2EE request failed",
    status: status ?? 0,
    code: getStructuredApiErrorCode(error) ?? null,
    currentEpoch: readCurrentEpoch(error),
  });
}

const enc = encodeURIComponent;

/** The account whose session an E2EE client may use: its engine's own. */
export interface E2eeApiAccount {
  readonly profileId: string;
  readonly wallet: string;
}

/**
 * The common API helpers send the browser's active session, which every tab
 * shares and which an account switch replaces in place. Unless that session
 * is the bound account acting as itself, this throws before anything is
 * sent: another profile's credentials would get E2EE_NOT_YOUR_DEVICE for a
 * device that is still valid. Status 0 (nothing sent) makes callers retry
 * later instead of treating it as an answer.
 */
export function assertE2eeAccount(account: E2eeApiAccount): void {
  const wallet = getWalletAddress()?.toLowerCase() ?? null;
  const role = getWalletRole();
  if (
    wallet === account.wallet.toLowerCase() &&
    (!role || role === account.profileId)
  ) {
    return;
  }
  throw new E2eeApiError({
    message: "The active account is not this engine's",
    status: 0,
    code: "E2EE_ACCOUNT_CHANGED",
  });
}

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toE2eeApiError(error);
  }
}

function requests(account: E2eeApiAccount) {
  // Checked right before the helper reads the session for its headers.
  const send = <T>(request: () => Promise<T>) =>
    call(() => {
      assertE2eeAccount(account);
      return request();
    });
  return {
    get: <T>(endpoint: string, params?: Record<string, string>) =>
      send(() =>
        commonApiFetch<T>({
          endpoint,
          ...(params ? { params } : {}),
          errorMode: "structured",
          cache: "no-store",
        })
      ),
    post: <T>(endpoint: string, body: object) =>
      send(() =>
        commonApiPost<object, T>({ endpoint, body, errorMode: "structured" })
      ),
    put: <T>(endpoint: string, body: object) =>
      send(() =>
        commonApiPut<object, T>({ endpoint, body, errorMode: "structured" })
      ),
  };
}

/**
 * REST client over the common API helpers for one account: a request goes
 * out only while the browser's session is that account's own.
 */
export function createE2eeApiClient(account: E2eeApiAccount): E2eeApiClient {
  const { get, post, put } = requests(account);
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
    getBlobChunk: (blobId, index, deviceKey) =>
      get(`e2ee/blobs/${enc(blobId)}/chunks/${index}`, {
        device_key: deviceKey,
      }),
    report: (body) => post(`e2ee/reports`, body),
  };
}
