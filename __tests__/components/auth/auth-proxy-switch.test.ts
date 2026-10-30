import { createAuthRequestActions } from "@/components/auth/authActions";
import type { CreateAuthRequestActionsParams } from "@/components/auth/authActionTypes";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { getAuthJwt, removeAuthJwt } from "@/services/auth/auth.utils";
import {
  getSessionNonce,
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";

const ADDRESS = "0x1111111111111111111111111111111111111111";
let mockWalletAddress: string | null = ADDRESS;

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "existing-session"),
  getWalletAddress: () => mockWalletAddress,
  canStoreAnotherWalletAccount: () => true,
  removeAuthJwt: jest.fn(),
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));
jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionNonce: jest.fn(),
  loginWithSessionV2: jest.fn(),
  persistSessionResponse: jest.fn(),
}));
jest.mock("@/hooks/useSecureSign", () => ({
  ConnectionMismatchError: class extends Error {
    readonly name = "ConnectionMismatchError";
  },
  MobileSigningError: class extends Error {
    readonly name = "MobileSigningError";
  },
  SigningProviderError: class extends Error {
    readonly name = "SigningProviderError";
  },
}));
jest.mock("@/utils/error-sanitizer", () => ({
  logErrorSecurely: jest.fn(),
  sanitizeErrorForUser: () => "Authentication failed",
}));

const proxy = {
  id: "proxy-1",
  created_by: { id: "grantor-profile" },
} as ApiProfileProxy;
const nonce = {
  signable_message: "Sign in to 6529",
  server_signature: "server-signature",
};

function createActions(
  overrides: Partial<CreateAuthRequestActionsParams> = {}
) {
  const params: CreateAuthRequestActionsParams = {
    activeProfileProxy: null,
    address: ADDRESS,
    authRolloutSettings: {
      structuredSignaturesRequired: false,
      sessionV2MigrationDeadline: null,
    },
    canSignActiveWallet: true,
    enableWalletAuthentication: true,
    expireSessionUpgradeAuth: jest.fn(),
    invalidateAll: jest.fn(),
    isActiveChainSupported: () => true,
    isAddressAuthorized: true,
    seizeConnect: jest.fn(),
    seizeDisconnect: jest.fn(),
    resetSessionUpgradeExpiryDedupe: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    setAuthLoadingState: jest.fn(),
    setSessionUpgradeRequired: jest.fn(),
    setShowSignModal: jest.fn(),
    setSignModalReason: jest.fn(),
    setToast: jest.fn(),
    showSessionUpgradePrompt: jest.fn(),
    signMessage: jest.fn(async () => ({
      signature: "client-signature",
      userRejected: false,
    })),
    signModalReason: "auth",
    ...overrides,
  };
  return { params, ...createAuthRequestActions(params) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWalletAddress = ADDRESS;
  jest.mocked(getSessionNonce).mockResolvedValue(nonce);
  jest.mocked(loginWithSessionV2).mockResolvedValue({
    address: ADDRESS,
    role: "grantor-profile",
    access_token: "replacement-session",
    access_token_expires_at: "2999-01-01T00:00:00Z",
    client_type: "web",
  });
  jest.mocked(persistSessionResponse).mockResolvedValue(true);
});

it("preserves the current session until the replacement sign-in succeeds", async () => {
  const signing = createDeferredPromise<{
    signature: string | null;
    userRejected: boolean;
  }>();
  const { onActiveProfileProxy, params } = createActions({
    signMessage: () => signing.promise,
  });
  const result = onActiveProfileProxy(proxy);
  await Promise.resolve();
  await Promise.resolve();
  expect(getAuthJwt()).toBe("existing-session");
  expect(removeAuthJwt).not.toHaveBeenCalled();
  expect(params.setActiveProfileProxy).not.toHaveBeenCalled();
  signing.resolve({ signature: "client-signature", userRejected: false });
  await expect(result).resolves.toBe(true);
  expect(loginWithSessionV2).toHaveBeenCalledWith(
    expect.objectContaining({ signerAddress: ADDRESS, role: "grantor-profile" })
  );
  expect(persistSessionResponse).toHaveBeenCalledTimes(1);
  expect(params.setActiveProfileProxy).toHaveBeenCalledWith(proxy);
  expect(params.invalidateAll).toHaveBeenCalledTimes(1);
  expect(removeAuthJwt).not.toHaveBeenCalled();
});

it("keeps the existing selection and session when signing is canceled", async () => {
  const { onActiveProfileProxy, params } = createActions({
    activeProfileProxy: proxy,
    signMessage: async () => ({ signature: null, userRejected: true }),
  });
  await expect(onActiveProfileProxy(null)).resolves.toBe(false);
  expect(params.setToast).toHaveBeenCalledWith({
    message: "Authentication was canceled in your wallet.",
    type: "error",
  });
  expect(params.setActiveProfileProxy).not.toHaveBeenCalled();
  expect(persistSessionResponse).not.toHaveBeenCalled();
  expect(removeAuthJwt).not.toHaveBeenCalled();
});

it.each(["nonce", "login", "persistence"])(
  "preserves the existing profile when %s fails",
  async (stage) => {
    if (stage === "nonce") {
      jest.mocked(getSessionNonce).mockRejectedValueOnce(new Error("offline"));
    } else if (stage === "login") {
      jest
        .mocked(loginWithSessionV2)
        .mockRejectedValueOnce(new Error("denied"));
    } else {
      jest.mocked(persistSessionResponse).mockResolvedValueOnce(false);
    }
    const { onActiveProfileProxy, params } = createActions();
    await expect(onActiveProfileProxy(proxy)).resolves.toBe(false);
    expect(params.setToast).toHaveBeenCalled();
    expect(params.setActiveProfileProxy).not.toHaveBeenCalled();
    expect(removeAuthJwt).not.toHaveBeenCalled();
  }
);

it.each([false, true])(
  "opens wallet recovery for disconnected=%s",
  async (disconnected) => {
    const { onActiveProfileProxy, params } = createActions({
      canSignActiveWallet: !disconnected,
      isActiveChainSupported: () => false,
    });
    await expect(onActiveProfileProxy(proxy)).resolves.toBe(false);
    expect(params.seizeConnect).toHaveBeenCalledTimes(1);
    expect(params.setToast).toHaveBeenCalled();
    expect(getSessionNonce).not.toHaveBeenCalled();
    expect(removeAuthJwt).not.toHaveBeenCalled();
  }
);

it("does not sign or persist after the active account changes", async () => {
  const pendingNonce = createDeferredPromise<typeof nonce>();
  jest.mocked(getSessionNonce).mockReturnValueOnce(pendingNonce.promise);
  const { onActiveProfileProxy, params } = createActions();
  const result = onActiveProfileProxy(proxy);
  mockWalletAddress = "0x2222222222222222222222222222222222222222";
  pendingNonce.resolve(nonce);
  await expect(result).resolves.toBe(false);
  expect(params.signMessage).not.toHaveBeenCalled();
  expect(persistSessionResponse).not.toHaveBeenCalled();
  expect(params.setToast).toHaveBeenCalled();
});
