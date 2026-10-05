import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { commonApiPost } from "@/services/api/common-api";
import { sessionAwareFetch } from "@/services/api/session-aware-fetch";
import {
  ensureActiveSession,
  SessionRecoveryError,
} from "@/services/auth/session-readiness";
import {
  __resetSessionRefreshStateForTests,
  refreshSessionV2,
} from "@/services/auth/session-v2.utils";
import {
  getNativeRefreshToken,
  getNativeRefreshRequestId,
  removeNativeRefreshToken,
  setNativeRefreshToken,
} from "@/services/auth/native-refresh-token-storage";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import { act, renderHook } from "@testing-library/react";
import { useSessionRecovery } from "@/components/auth/useSessionRecovery";

let mockAddress: string;
let mockJwt: string | null;
let mockRole: string | null;
let mockHasSession = true;
const mockSetAuth = jest.fn((_address: string, token: string) => {
  mockJwt = token;
  window.dispatchEvent(new Event("token-change"));
  return true;
});

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "token-change",
  WALLET_ACCOUNTS_UPDATED_EVENT: "account-change",
  getAuthJwt: () => mockJwt,
  getWalletAddress: () => mockAddress,
  getWalletRole: () => mockRole,
  hasActiveSessionV2Auth: () => mockHasSession,
  setAuthJwt: (...args: [string, string]) => mockSetAuth(...args),
  syncWalletRoleWithServer: jest.fn(),
  isAuthJwtUsable: (token: string | null, now = Date.now() / 1000) => {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp: number };
    return payload.exp > now;
  },
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiFetch: jest.fn(),
}));
jest.mock("@/services/notifications/push-installation", () => ({
  queueNativePushLogout: jest.fn(),
}));
jest.mock("@/services/analytics/mixpanel", () => ({
  trackAuthImpactEvent: jest.fn(),
}));
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(() => false) },
}));
jest.mock("@capacitor/app", () => ({ App: { addListener: jest.fn() } }));
jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

const makeJwt = (expiresIn: number, issuedAgo = 0) =>
  `e30.${btoa(JSON.stringify({ sub: mockAddress, exp: Date.now() / 1000 + expiresIn, iat: Date.now() / 1000 - issuedAgo }))}.signature`;
const response = (native = false) => ({
  address: mockAddress,
  role: null,
  access_token: makeJwt(3600),
  access_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  client_type: native ? "native" : "web",
  ...(native
    ? {
        native_refresh_token: "b".repeat(128),
        refresh_token_expires_at: "2027-01-01T00:00:00Z",
      }
    : {}),
});
let counter = 0;
beforeEach(() => {
  jest.clearAllMocks();
  __resetSessionRefreshStateForTests();
  mockAddress = `0x${(++counter).toString(16).padStart(40, "0")}`;
  mockRole = null;
  mockHasSession = true;
  mockJwt = makeJwt(-1);
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  const vault = new Map<string, string>();
  jest.mocked(SecureStoragePlugin.get).mockImplementation(async ({ key }) => {
    if (!vault.has(key)) throw new Error("Item with given key does not exist");
    return { value: vault.get(key)! };
  });
  jest
    .mocked(SecureStoragePlugin.set)
    .mockImplementation(async ({ key, value }) => {
      vault.set(key, value);
      return { value: true };
    });
  jest
    .mocked(SecureStoragePlugin.remove)
    .mockImplementation(async ({ key }) => {
      vault.delete(key);
      return { value: true };
    });
});
afterEach(() => {
  __resetSessionRefreshStateForTests();
  jest.useRealTimers();
});

it("renews an old but usable JWT proactively without blocking protected requests", async () => {
  mockJwt = makeJwt(30 * 86400, 3601);
  const savedJwt = mockJwt;
  await sessionAwareFetch(
    "https://api.test/api/notifications",
    { method: "GET" },
    true
  );
  expect(commonApiPost).not.toHaveBeenCalled();
  expect(
    new Headers(jest.mocked(fetch).mock.calls[0]![1]?.headers).get(
      "Authorization"
    )
  ).toBe(`Bearer ${savedJwt}`);
  jest.mocked(commonApiPost).mockResolvedValueOnce(response());
  await ensureActiveSession({ renewBeforeSeconds: 60 });
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  expect(mockJwt).not.toBe(savedJwt);
});

it("does not start another refresh when persistence announces a short-lived access token", async () => {
  jest.mocked(commonApiPost).mockResolvedValueOnce({
    ...response(),
    access_token: makeJwt(35),
  });
  const { unmount } = renderHook(() => useSessionRecovery(true));
  await act(async () => {
    await ensureActiveSession();
  });
  expect(mockSetAuth).toHaveBeenCalledTimes(1);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  unmount();
});

it("reopens with an expired JWT and sends concurrent reads and mutations only after one refresh", async () => {
  let finish!: (value: ReturnType<typeof response>) => void;
  jest.mocked(commonApiPost).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const init = {
    method: "GET",
    headers: { Authorization: `Bearer ${mockJwt}` },
  };
  const read = sessionAwareFetch(
    "https://api.test/api/notifications",
    init,
    true
  );
  const write = sessionAwareFetch(
    "https://api.test/api/notifications/read",
    { ...init, method: "POST" },
    true
  );
  await Promise.resolve();
  expect(fetch).not.toHaveBeenCalled();
  const renewed = response();
  finish(renewed);
  await Promise.all([read, write]);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  expect(mockSetAuth).toHaveBeenCalledTimes(1);
  for (const [, options] of jest.mocked(fetch).mock.calls) {
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      `Bearer ${renewed.access_token}`
    );
  }
});

it("waits Retry-After once without clearing the saved session or prompting a signature", async () => {
  jest.useFakeTimers();
  const busy = Object.assign(new Error("busy"), {
    status: 429,
    headers: new Headers({ "Retry-After": "1" }),
  });
  jest
    .mocked(commonApiPost)
    .mockRejectedValueOnce(busy)
    .mockResolvedValueOnce(response());
  const recovery = ensureActiveSession();
  await jest.advanceTimersByTimeAsync(0);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  expect(mockSetAuth).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1000);
  await expect(recovery).resolves.toBe(mockJwt);
  expect(commonApiPost).toHaveBeenCalledTimes(2);
});

it("preserves native authentication when the secure vault is temporarily unavailable", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  const savedJwt = mockJwt;
  jest
    .mocked(SecureStoragePlugin.get)
    .mockRejectedValueOnce(new Error("Keychain is temporarily unavailable"));
  await expect(ensureActiveSession()).rejects.toMatchObject({
    terminal: false,
    status: 503,
  });
  expect(mockJwt).toBe(savedJwt);
  expect(mockSetAuth).not.toHaveBeenCalled();
  expect(SecureStoragePlugin.remove).not.toHaveBeenCalled();
  expect(commonApiPost).not.toHaveBeenCalled();
});

it.each([
  "{broken",
  JSON.stringify({ token: "a".repeat(128), id: "invalid-id" }),
])(
  "repairs a corrupt native retry journal without discarding the saved token",
  async (stored) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const token = "a".repeat(128);
    await setNativeRefreshToken({ address: mockAddress, refreshToken: token });
    jest
      .mocked(SecureStoragePlugin.get)
      .mockResolvedValueOnce({ value: stored });
    const requestId = await getNativeRefreshRequestId(mockAddress, token);
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getNativeRefreshRequestId(mockAddress, token)).toBe(requestId);
    expect(await getNativeRefreshToken(mockAddress)).toBe(token);
    expect(SecureStoragePlugin.remove).not.toHaveBeenCalled();
  }
);

it("returns a 401 without replaying a body outside the supported replayable types", async () => {
  mockJwt = makeJwt(3600);
  const rejected = { ok: false, status: 401 };
  jest.mocked(fetch).mockResolvedValueOnce(rejected as Response);
  await expect(
    sessionAwareFetch(
      "https://api.test/api/upload",
      {
        method: "POST",
        body: new Blob(["payload"]),
      },
      true
    )
  ).resolves.toBe(rejected);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("never turns a rate-limit cooldown into terminal invalidation during immediate validation", async () => {
  const busy = Object.assign(new Error("busy"), {
    status: 429,
    headers: new Headers({ "Retry-After": "10" }),
  });
  jest.mocked(commonApiPost).mockRejectedValueOnce(busy);
  const callbacks = {
    onShowSignModal: jest.fn(),
    onInvalidateCache: jest.fn(),
    onReset: jest.fn(),
    onRemoveJwt: jest.fn(),
    onLogError: jest.fn(),
  };
  const params = {
    currentAddress: mockAddress,
    connectionAddress: mockAddress,
    jwt: mockJwt,
    activeProfileProxy: null,
    isConnected: true,
    operationId: "resume",
    abortSignal: new AbortController().signal,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await validateAuthImmediate({ params, callbacks });
    expect(result.shouldShowModal).toBe(false);
  }
  expect(callbacks.onRemoveJwt).not.toHaveBeenCalled();
  expect(callbacks.onShowSignModal).not.toHaveBeenCalled();
  expect(commonApiPost).toHaveBeenCalledTimes(1);
});

it.each([
  new TypeError("Failed to fetch"),
  Object.assign(new Error("Unavailable"), { status: 503 }),
])("preserves saved credentials after transient failure %s", async (error) => {
  jest.mocked(commonApiPost).mockRejectedValueOnce(error);
  await expect(ensureActiveSession()).rejects.toMatchObject({
    terminal: false,
    status: 503,
  });
  expect(mockJwt).not.toBeNull();
  expect(mockSetAuth).not.toHaveBeenCalled();
});

it("does not replay a request for another account after a switch during recovery", async () => {
  let finish!: (value: ReturnType<typeof response>) => void;
  jest.mocked(commonApiPost).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const renewed = response();
  const request = sessionAwareFetch(
    "https://api.test/api/notifications",
    { method: "GET" },
    true
  );
  mockAddress = "0xother";
  finish(renewed);
  await expect(request).rejects.toMatchObject({ name: "AbortError" });
  expect(fetch).not.toHaveBeenCalled();
  expect(mockSetAuth).not.toHaveBeenCalled();
});

it("retries a server-rejected access token once and keeps unrelated explicit credentials unchanged", async () => {
  mockJwt = makeJwt(1000);
  jest
    .mocked(fetch)
    .mockResolvedValueOnce({ ok: false, status: 401 } as Response);
  jest.mocked(commonApiPost).mockResolvedValueOnce(response());
  await sessionAwareFetch(
    "https://api.test/api/notifications",
    { method: "GET" },
    true
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  await sessionAwareFetch(
    "https://api.test/api/notifications",
    { headers: { Authorization: "Bearer another-account" } },
    true
  );
  expect(commonApiPost).toHaveBeenCalledTimes(1);
});

it("persists native rotation after its only UI caller aborts", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  await setNativeRefreshToken({
    address: mockAddress,
    refreshToken: "a".repeat(128),
  });
  let finish!: (value: ReturnType<typeof response>) => void;
  const started = new Promise<void>((resolve) => {
    jest.mocked(commonApiPost).mockImplementationOnce(() => {
      resolve();
      return new Promise((done) => {
        finish = done;
      });
    });
  });
  const controller = new AbortController();
  const request = refreshSessionV2({
    address: mockAddress,
    abortSignal: controller.signal,
  });
  await started;
  controller.abort();
  await expect(request).rejects.toMatchObject({ name: "AbortError" });
  const survivor = refreshSessionV2({ address: mockAddress });
  finish(response(true));
  await survivor;
  expect(await getNativeRefreshToken(mockAddress)).toBe("b".repeat(128));
  expect(commonApiPost).toHaveBeenCalledTimes(1);
});

it("persists the retry ID before sending and reuses it after a lost response", async () => {
  jest.useFakeTimers();
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  await setNativeRefreshToken({
    address: mockAddress,
    refreshToken: "a".repeat(128),
  });
  const id = await getNativeRefreshRequestId(mockAddress, "a".repeat(128));
  jest
    .mocked(commonApiPost)
    .mockRejectedValueOnce(new TypeError("lost response"))
    .mockResolvedValueOnce(response(true));
  await expect(refreshSessionV2({ address: mockAddress })).rejects.toThrow(
    "lost response"
  );
  jest.advanceTimersByTime(86400000);
  await refreshSessionV2({ address: mockAddress });
  for (const [request] of jest.mocked(commonApiPost).mock.calls) {
    expect(request.body).toMatchObject({
      refresh_request_id: id,
      native_refresh_token: "a".repeat(128),
    });
  }
});

it("does not resurrect native credentials after logout while refresh is in flight", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  await setNativeRefreshToken({
    address: mockAddress,
    refreshToken: "a".repeat(128),
  });
  let finish!: (value: ReturnType<typeof response>) => void;
  const started = new Promise<void>((resolve) => {
    jest.mocked(commonApiPost).mockImplementationOnce(() => {
      resolve();
      return new Promise((done) => {
        finish = done;
      });
    });
  });
  const request = refreshSessionV2({ address: mockAddress });
  await started;
  await removeNativeRefreshToken(mockAddress);
  finish(response(true));
  await expect(request).rejects.toMatchObject({
    name: "TokenRefreshCancelledError",
  });
  expect(await getNativeRefreshToken(mockAddress)).toBeNull();
});

it("distinguishes a genuinely expired refresh session from temporary failures", async () => {
  jest
    .mocked(commonApiPost)
    .mockRejectedValueOnce(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );
  await expect(ensureActiveSession()).rejects.toBeInstanceOf(
    SessionRecoveryError
  );
  await expect(ensureActiveSession()).rejects.toMatchObject({
    terminal: true,
    status: 401,
  });
});
