import { createAuthRequestActions } from "@/components/auth/authActions";
import type { CreateAuthRequestActionsParams } from "@/components/auth/authActionTypes";
import { getSessionNonce } from "@/services/auth/session-v2.utils";

/**
 * "Turn on signed messages" keeps its wallet gates (a live wallet, a
 * supported network, no dev auth) unless the local browser-test signer is
 * installed; only that seam stands in for the wallet.
 */

const ADDRESS = "0x1111111111111111111111111111111111111111";

let mockTestSigner: ((message: string) => Promise<string>) | null = null;
jest.mock("@/components/auth/signedMessagesTestSigner", () => ({
  getSignedMessagesTestSigner: () => mockTestSigner,
}));

let mockDevAuth = false;
jest.mock("@/config/devAuth", () => ({
  isDevAuthEnabled: () => mockDevAuth,
  isDevLikeEnv: () => true,
}));

// The website (not an app); this browser cannot hold a device key here, so a
// grant sign-in that passes the wallet gates ends at "device-key".
jest.mock("@/lib/device-signing/login-grant", () => ({
  ...jest.requireActual("@/lib/device-signing/login-grant"),
  isAppGrantPlatform: () => false,
  isDeviceGrantPossible: () => false,
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "existing-session"),
  getWalletAddress: () => ADDRESS,
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
  ConnectionMismatchError: class extends Error {},
  MobileSigningError: class extends Error {},
  SigningProviderError: class extends Error {},
}));
jest.mock("@/utils/error-sanitizer", () => ({
  logErrorSecurely: jest.fn(),
  sanitizeErrorForUser: () => "Authentication failed",
}));

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

const turnOn = (overrides: Partial<CreateAuthRequestActionsParams> = {}) => {
  const actions = createActions(overrides);
  return {
    actions,
    result: actions.requestSignedMessagesGrant({ silent: true }),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockTestSigner = null;
  mockDevAuth = false;
});

describe("with the test signer seam off", () => {
  it("requires a live wallet", async () => {
    const { result } = turnOn({ canSignActiveWallet: false });
    await expect(result).resolves.toEqual({
      success: false,
      reason: "wallet-disconnected",
    });
  });

  it("requires a supported network", async () => {
    const { result } = turnOn({ isActiveChainSupported: () => false });
    await expect(result).resolves.toEqual({
      success: false,
      reason: "wrong-network",
    });
  });

  it("never signs in under dev auth", async () => {
    mockDevAuth = true;
    const { result } = turnOn();
    await expect(result).resolves.toEqual({
      success: false,
      reason: "unavailable",
    });
  });

  it("never signs in through a proxy", async () => {
    const { result } = turnOn({
      activeProfileProxy: { id: "proxy" } as never,
    });
    await expect(result).resolves.toEqual({
      success: false,
      reason: "unavailable",
    });
  });
});

describe("with the test signer seam on", () => {
  it("stands in for the wallet, its network and dev auth, never for a proxy", async () => {
    mockTestSigner = jest.fn(async () => "0xtestsig");
    mockDevAuth = true;
    const { actions, result } = turnOn({
      canSignActiveWallet: false,
      isActiveChainSupported: () => false,
    });
    // Past every wallet gate: this browser then has no device key to grant.
    await expect(result).resolves.toEqual({
      success: false,
      reason: "device-key",
    });
    expect(actions.params.signMessage).not.toHaveBeenCalled();
    expect(getSessionNonce).not.toHaveBeenCalled();

    const proxied = turnOn({ activeProfileProxy: { id: "proxy" } as never });
    await expect(proxied.result).resolves.toEqual({
      success: false,
      reason: "unavailable",
    });
  });
});
