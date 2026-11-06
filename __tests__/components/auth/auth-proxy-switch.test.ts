import { createAuthRequestActions } from "@/components/auth/authActions";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuthRequestActions } from "@/components/auth/useAuthRequestActions";
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
let mockCanSignActiveWallet = true;
let mockSeizeConnectOpen = false;
const mockSeizeConnect = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    canSignActiveWallet: mockCanSignActiveWallet,
    seizeConnect: mockSeizeConnect,
    seizeConnectOpen: mockSeizeConnectOpen,
    connectedAccounts: [],
  }),
}));

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
    override readonly name = "ConnectionMismatchError";
  },
  MobileSigningError: class extends Error {
    override readonly name = "MobileSigningError";
  },
  SigningProviderError: class extends Error {
    override readonly name = "SigningProviderError";
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
    ownProfileId: null,
    signAppGrant: jest.fn(),
    ...overrides,
  };
  return { params, ...createAuthRequestActions(params) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWalletAddress = ADDRESS;
  mockCanSignActiveWallet = true;
  mockSeizeConnectOpen = false;
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

it("does not persist a completed login after the network changes", async () => {
  const login =
    createDeferredPromise<Awaited<ReturnType<typeof loginWithSessionV2>>>();
  jest.mocked(loginWithSessionV2).mockReturnValueOnce(login.promise);
  let isSupported = true;
  const { onActiveProfileProxy, params } = createActions({
    isActiveChainSupported: () => isSupported,
  });
  const result = onActiveProfileProxy(proxy);
  await waitFor(() => expect(loginWithSessionV2).toHaveBeenCalled());
  isSupported = false;
  login.resolve({
    address: ADDRESS,
    role: "grantor-profile",
    access_token: "replacement-session",
    access_token_expires_at: "2999-01-01T00:00:00Z",
    client_type: "web",
  });
  await expect(result).resolves.toBe(false);
  expect(persistSessionResponse).not.toHaveBeenCalled();
  expect(params.setActiveProfileProxy).not.toHaveBeenCalled();
  expect(params.setToast).toHaveBeenCalled();
  expect(removeAuthJwt).not.toHaveBeenCalled();
});

it("resumes the signed-in wallet when its live address returns without reopening the modal", async () => {
  mockCanSignActiveWallet = false;
  const { params } = createActions({
    canSignActiveWallet: false,
    address: undefined,
  });
  const { result, rerender } = renderHook(useAuthRequestActions, {
    initialProps: params,
  });
  await act(async () => {
    expect(await result.current.onActiveProfileProxy(proxy)).toBe(false);
  });
  expect(mockSeizeConnect).toHaveBeenCalledTimes(1);
  expect(params.signMessage).not.toHaveBeenCalled();
  mockSeizeConnectOpen = true;
  rerender(params);
  mockCanSignActiveWallet = true;
  mockSeizeConnectOpen = false;
  rerender({ ...params, address: ADDRESS, canSignActiveWallet: true });
  await waitFor(() =>
    expect(params.setActiveProfileProxy).toHaveBeenCalledWith(proxy)
  );
  expect(mockSeizeConnect).toHaveBeenCalledTimes(1);
  expect(params.signMessage).toHaveBeenCalledTimes(1);
  expect(loginWithSessionV2).toHaveBeenCalledTimes(1);
  expect(persistSessionResponse).toHaveBeenCalledTimes(1);
});

it.each([true, false])(
  "returns the real connected sign-in result (%s)",
  async (success) => {
    const { params } = createActions({
      signMessage: jest.fn(async () => ({
        signature: success ? "client-signature" : null,
        userRejected: !success,
      })),
    });
    const { result } = renderHook(useAuthRequestActions, {
      initialProps: params,
    });
    await act(async () => {
      expect(await result.current.onActiveProfileProxy(proxy)).toBe(success);
    });
    expect(params.signMessage).toHaveBeenCalledTimes(1);
    expect(mockSeizeConnect).not.toHaveBeenCalled();
  }
);

it("cancels a queued proxy switch when the saved signed-in wallet changes", async () => {
  mockCanSignActiveWallet = false;
  const { params } = createActions({ canSignActiveWallet: false });
  const { result, rerender } = renderHook(useAuthRequestActions, {
    initialProps: params,
  });
  await act(async () => {
    await result.current.onActiveProfileProxy(proxy);
  });
  mockSeizeConnectOpen = true;
  rerender(params);
  mockWalletAddress = "0x2222222222222222222222222222222222222222";
  mockCanSignActiveWallet = true;
  rerender({
    ...params,
    address: mockWalletAddress,
    canSignActiveWallet: true,
  });
  expect(params.signMessage).not.toHaveBeenCalled();
  expect(persistSessionResponse).not.toHaveBeenCalled();
  expect(params.setToast).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: "error" })
  );
});
