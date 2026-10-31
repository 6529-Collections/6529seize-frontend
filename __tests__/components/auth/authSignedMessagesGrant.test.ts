import { createSignedMessagesGrantRequest } from "@/components/auth/authSignedMessagesGrant";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const SIGNATURE = `0x${"ab".repeat(65)}`;

const mockPersistSessionResponse = jest.fn();
const mockLoginWithSessionV2 = jest.fn();
jest.mock("@/services/auth/session-v2.utils", () => ({
  loginWithSessionV2: (...args: unknown[]) => mockLoginWithSessionV2(...args),
  persistSessionResponse: (...args: unknown[]) =>
    mockPersistSessionResponse(...args),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: () => true,
}));

const GRANT = {
  address: ADDRESS,
  deviceKeyHex: `0x${"aa".repeat(32)}`,
  scopes: ["post", "edit", "delete", "react"],
  label: "Chrome on macOS",
};
let mockPreparedGrant: typeof GRANT | null = GRANT;
let mockIsGrantChallenge = true;
jest.mock("@/lib/device-signing/login-grant", () => ({
  carriesDeviceGrant: () => false,
  isDeviceGrantChallenge: () => mockIsGrantChallenge,
  isDeviceGrantPossible: () => true,
  prepareLoginDeviceGrant: async () => mockPreparedGrant,
  skipAutoDeviceGrant: jest.fn(),
  storeLoginDeviceGrant: jest.fn(async () => undefined),
  toDeviceGrantNonceParams: () => ({}),
}));

const nonce = (): ApiSessionNonceResponse =>
  ({
    signable_message: "Sign in to 6529",
    server_signature: "server",
  }) as ApiSessionNonceResponse;

interface SignatureResult {
  signature: string | null;
  userRejected: boolean;
  failureToastShown: boolean;
  error?: unknown;
}

const signed = (): SignatureResult => ({
  signature: SIGNATURE,
  userRejected: false,
  failureToastShown: false,
});

const createSubject = ({
  signatureResult = signed(),
  ...overrides
}: Partial<Parameters<typeof createSignedMessagesGrantRequest>[0]> & {
  readonly signatureResult?: SignatureResult;
} = {}) => {
  let current = true;
  const guard = {
    isCurrent: () => current,
    acceptCurrentState: () => current,
  };
  const getSignature = jest.fn(
    async (_params: { message: string }): Promise<SignatureResult> =>
      signatureResult
  );
  const deps = {
    address: ADDRESS,
    canAuthenticate: true,
    canSignActiveWallet: true,
    createSigningAuthRequestGuard: jest.fn(() => guard),
    createGetSignature: jest.fn(() => getSignature),
    getNonce: jest.fn(async () => nonce()),
    isActiveChainSupported: jest.fn(() => true),
    setAuthLoadingState: jest.fn(),
    setToast: jest.fn(),
    ...overrides,
  };
  return {
    deps,
    getSignature,
    request: createSignedMessagesGrantRequest(deps),
    invalidateGuard: () => {
      current = false;
    },
  };
};

describe("turn on signed messages", () => {
  beforeEach(() => {
    mockPreparedGrant = GRANT;
    mockIsGrantChallenge = true;
    mockLoginWithSessionV2.mockReset().mockResolvedValue({
      client_type: "web",
      role: null,
    });
    mockPersistSessionResponse.mockReset().mockResolvedValue(true);
  });

  it("signs in the active wallet once with a device grant challenge", async () => {
    const onSignatureRequested = jest.fn();
    const { deps, getSignature, request } = createSubject();

    await expect(request({ onSignatureRequested })).resolves.toEqual({
      success: true,
    });
    expect(deps.getNonce).toHaveBeenCalledWith(
      expect.objectContaining({ signerAddress: ADDRESS, deviceGrant: {} })
    );
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(onSignatureRequested).toHaveBeenCalledTimes(1);
    expect(jest.mocked(deps.setAuthLoadingState).mock.calls).toEqual([
      ["signing"],
      ["idle"],
    ]);
  });

  it.each([
    ["without an address", { address: undefined }],
    ["for proxies or disabled wallet auth", { canAuthenticate: false }],
  ])("reports unavailable %s", async (_case, overrides) => {
    const { deps, request } = createSubject(overrides);
    await expect(request()).resolves.toEqual({
      success: false,
      reason: "unavailable",
    });
    expect(deps.getNonce).not.toHaveBeenCalled();
    expect(deps.setToast).not.toHaveBeenCalled();
  });

  it("names a missing live connection first: without one the network is unknown too", async () => {
    // This used to return silently as an unsupported network.
    const { deps, request } = createSubject({
      canSignActiveWallet: false,
      isActiveChainSupported: () => false,
    });
    await expect(request()).resolves.toEqual({
      success: false,
      reason: "wallet-disconnected",
    });
    expect(deps.setToast).toHaveBeenCalledWith({
      message: "Reconnect the wallet for this profile and try again.",
      type: "error",
    });
    expect(deps.getNonce).not.toHaveBeenCalled();
  });

  it("leaves the message to callers that report failures themselves", async () => {
    const { deps, request } = createSubject({ canSignActiveWallet: false });
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "wallet-disconnected",
    });
    expect(deps.setToast).not.toHaveBeenCalled();
  });

  it("reports an unsupported network without signing", async () => {
    const { deps, request } = createSubject({
      isActiveChainSupported: () => false,
    });
    await expect(request()).resolves.toEqual({
      success: false,
      reason: "wrong-network",
    });
    expect(deps.getNonce).not.toHaveBeenCalled();
  });

  it("calls a declined signature rejected and shows no toast when silent", async () => {
    const { deps, request } = createSubject({
      signatureResult: {
        signature: null,
        userRejected: true,
        failureToastShown: false,
      },
    });
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "rejected",
    });
    expect(deps.setToast).not.toHaveBeenCalled();
    expect(jest.mocked(deps.createGetSignature).mock.calls[0]?.[0]).not.toBe(
      deps.setToast
    );
  });

  it("keeps the sign-in toasts for callers that do not report failures", async () => {
    const { deps, request } = createSubject({
      signatureResult: {
        signature: null,
        userRejected: true,
        failureToastShown: false,
      },
    });
    await request();
    expect(deps.createGetSignature).toHaveBeenCalledWith(deps.setToast);
    expect(deps.setToast).toHaveBeenCalledWith({
      message: "Authentication was canceled in your wallet.",
      type: "error",
    });
  });

  it("tells a wallet error from a WalletConnect session that cannot reach the phone", async () => {
    const failed = createSubject({
      signatureResult: {
        signature: null,
        userRejected: false,
        failureToastShown: true,
        error: new Error("Wallet provider error"),
      },
    });
    await expect(failed.request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "signature-failed",
    });

    const stale = createSubject({
      signatureResult: {
        signature: null,
        userRejected: false,
        failureToastShown: true,
        error: Object.assign(new Error("Couldn't sign"), {
          cause: new Error("No matching key. session topic doesn't exist: 9f"),
        }),
      },
    });
    await expect(stale.request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "walletconnect-session",
    });
  });

  it("classifies a WebSocket relay error as a WalletConnect session problem", async () => {
    // The enable flow shows phone pairing only for WalletConnect wallets.
    const { request } = createSubject({
      signatureResult: {
        signature: null,
        userRejected: false,
        failureToastShown: true,
        error: new Error("WebSocket connection closed abnormally"),
      },
    });
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "walletconnect-session",
    });
  });

  it("names a challenge request failure", async () => {
    const { request } = createSubject({
      getNonce: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "challenge-failed",
    });
  });

  it("names a challenge that does not grant this browser's key", async () => {
    mockIsGrantChallenge = false;
    const { getSignature, request } = createSubject();
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "challenge-mismatch",
    });
    expect(getSignature).not.toHaveBeenCalled();
  });

  it("names a device key that could not be prepared", async () => {
    mockPreparedGrant = null;
    const { deps, request } = createSubject();
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "device-key",
    });
    expect(deps.getNonce).not.toHaveBeenCalled();
  });

  it("names a sign-in that failed after the wallet signed", async () => {
    mockLoginWithSessionV2.mockRejectedValue(new Error("login failed"));
    const { request } = createSubject();
    await expect(request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "sign-in-failed",
    });
  });

  it("names a network change while signing", async () => {
    const subject = createSubject();
    subject.getSignature.mockImplementation(async () => {
      subject.invalidateGuard();
      return signed();
    });
    await expect(subject.request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "context-changed",
    });
  });

  it("resets the loading state when the wallet step throws", async () => {
    const subject = createSubject();
    subject.getSignature.mockRejectedValue(new Error("boom"));
    await expect(subject.request({ silent: true })).resolves.toEqual({
      success: false,
      reason: "signature-failed",
    });
    expect(subject.deps.setAuthLoadingState).toHaveBeenLastCalledWith("idle");
  });
});
