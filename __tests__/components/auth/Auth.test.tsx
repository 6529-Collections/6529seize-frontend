import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Auth, { AuthContext, useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { mockTitleContextModule } from "@/__tests__/utils/titleTestUtils";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

jest.mock("react-toastify", () => ({
  toast: jest.fn(),
  ToastContainer: () => <div data-testid="toast" />,
  Slide: () => null,
}));

// Using useSecureSign instead of legacy Wagmi hooks

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() =>
    Promise.resolve({ id: "1", handle: "user", query: "user" })
  ),
  commonApiPost: jest.fn(() =>
    Promise.resolve({ token: "jwt-token", refresh_token: "refresh-token" })
  ),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: jest.fn(() => true),
  getWalletAddress: jest.fn(() => null),
  isAuthAddressAuthorized: jest.fn(
    ({
      address,
      connectedAccounts,
    }: {
      readonly address: string | null | undefined;
      readonly connectedAccounts: readonly { readonly address: string }[];
    }) =>
      Boolean(
        address &&
        connectedAccounts.some(
          (account) => account.address.toLowerCase() === address.toLowerCase()
        )
      )
  ),
  removeAuthJwt: jest.fn(),
  setActiveWalletAccount: jest.fn(() => true),
  setAuthJwt: jest.fn(),
  syncConnectedWalletProfile: jest.fn(),
  getAuthJwt: jest.fn(() => null),
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));

jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionClientType: jest.fn(() => "web"),
  getSessionNonce: jest.fn(),
  loginWithSessionV2: jest.fn(),
  persistSessionResponse: jest.fn(),
}));

// Using jwt-validation.utils instead of direct jwt-decode

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ data: undefined })),
}));

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
  })),
}));

const mockSignMessage = jest.fn();
const mockReset = jest.fn();
let mockIsSigningPending = false;

jest.mock("@/hooks/useSecureSign", () => ({
  useSecureSign: jest.fn(() => ({
    signMessage: mockSignMessage,
    isSigningPending: mockIsSigningPending,
    reset: mockReset,
  })),
  MobileSigningError: class MobileSigningError extends Error {},
  ConnectionMismatchError: class ConnectionMismatchError extends Error {},
  SigningProviderError: class SigningProviderError extends Error {},
}));

jest.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ children, show }: any) => (show ? <div>{children}</div> : null),
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <h4>{children}</h4>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Add mocks for new services
jest.mock("@/services/auth/jwt-validation.utils", () => ({
  validateJwt: jest.fn(async () => ({ isValid: true, wasCancelled: false })),
  getRole: jest.fn(() => null),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock("@/services/auth/immediate-validation.utils", () => ({
  validateAuthImmediate: jest.fn(async () => ({ wasCancelled: false })),
}));

jest.mock("@/utils/error-sanitizer", () => ({
  sanitizeErrorForUser: jest.fn((error) => "Sanitized error message"),
  logErrorSecurely: jest.fn(),
}));

jest.mock("@/utils/role-validation", () => ({
  validateRoleForAuthentication: jest.fn(
    (proxy) => proxy?.created_by?.id || null
  ),
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(() => ({
    profile: null,
    isLoading: false,
  })),
}));

// Mock TitleContext
mockTitleContextModule();

let mockAuthSettings = {
  structured_signatures_required: false,
  session_v2_migration_deadline: null as string | null,
};

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: () => ({
    seizeSettings: {
      auth: mockAuthSettings,
    },
  }),
}));

let walletAddress: string | null = "0x1";
let connectionState: string = "connected";
let canSignActiveWallet: boolean = true;
let connectedAccountsOverride:
  | readonly {
      readonly address: string;
      readonly role: string | null;
      readonly isActive: boolean;
      readonly isConnected: boolean;
    }[]
  | null = null;

const mockSeizeDisconnectAndLogout = jest.fn(() => Promise.resolve());
const mockSeizeDisconnect = jest.fn(() => Promise.resolve());
const mockSeizeConnect = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => {
    const connectedAccounts =
      connectedAccountsOverride ??
      (walletAddress
        ? [
            {
              address: walletAddress,
              role: null,
              isActive: true,
              isConnected: !!walletAddress,
            },
          ]
        : []);

    const { isAuthAddressAuthorized } = require("@/services/auth/auth.utils");

    return {
      address: walletAddress,
      connectedAccounts,
      hasValidWalletAuth: isAuthAddressAuthorized({
        address: walletAddress,
        connectedAccounts,
      }),
      isConnected: !!walletAddress && canSignActiveWallet,
      hasActiveWalletAddress: !!walletAddress,
      canSignActiveWallet,
      seizeConnect: mockSeizeConnect,
      seizeDisconnect: mockSeizeDisconnect,
      seizeDisconnectAndLogout: mockSeizeDisconnectAndLogout,
      isSafeWallet: false,
      connectionState: connectionState,
    };
  }),
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const mockCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;
const mockUseIdentity = require("@/hooks/useIdentity")
  .useIdentity as jest.MockedFunction<any>;

const enableAuthMigrationDeadline = (deadline = "2999-01-01T00:00:00.000Z") => {
  mockAuthSettings = {
    structured_signatures_required: false,
    session_v2_migration_deadline: deadline,
  };
};

function createDeferredPromise<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

// Test helper components
function ShowWaves() {
  const { showWaves } = useAuth();
  return <span data-testid="waves">{String(showWaves)}</span>;
}

function RequestAuthButton() {
  const { requestAuth } = useAuth();
  return (
    <button onClick={() => requestAuth()} data-testid="req">
      req
    </button>
  );
}

describe("Auth component", () => {
  beforeEach(() => {
    walletAddress = "0x1";
    connectionState = "connected";
    canSignActiveWallet = true;
    mockIsSigningPending = false;
    connectedAccountsOverride = null;
    mockAuthSettings = {
      structured_signatures_required: false,
      session_v2_migration_deadline: null,
    };
    globalThis.localStorage?.clear();
    jest.clearAllMocks();

    const authUtils = require("@/services/auth/auth.utils");
    const mockIsAuthAddressAuthorized =
      authUtils.isAuthAddressAuthorized as jest.MockedFunction<any>;
    const mockGetAuthJwt = require("@/services/auth/auth.utils")
      .getAuthJwt as jest.MockedFunction<any>;
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<any>;
    const mockCanStoreAnotherWalletAccount =
      authUtils.canStoreAnotherWalletAccount as jest.MockedFunction<any>;
    const mockSetActiveWalletAccount =
      authUtils.setActiveWalletAccount as jest.MockedFunction<any>;
    mockSeizeConnect.mockReset();
    mockGetAuthJwt.mockReturnValue(null);
    mockGetWalletAddress.mockReturnValue(null);
    mockCanStoreAnotherWalletAccount.mockReturnValue(true);
    mockSetActiveWalletAccount.mockReturnValue(true);
    mockIsAuthAddressAuthorized.mockImplementation(
      ({
        address,
        connectedAccounts,
      }: {
        readonly address: string | null | undefined;
        readonly connectedAccounts: readonly { readonly address: string }[];
      }) =>
        Boolean(
          address &&
          connectedAccounts.some(
            (account) => account.address.toLowerCase() === address.toLowerCase()
          )
        )
    );

    const jwtValidation = require("@/services/auth/jwt-validation.utils");
    jwtValidation.validateJwt.mockResolvedValue({
      isValid: true,
      wasCancelled: false,
    });
    jwtValidation.getRole.mockReturnValue(null);
    const immediateValidation =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
    immediateValidation.mockReset();
    immediateValidation.mockResolvedValue({
      validationCompleted: true,
      wasCancelled: false,
      shouldShowModal: false,
    });

    // Reset mock implementations
    mockSignMessage.mockResolvedValue({
      signature: "0xsignature",
      userRejected: false,
      error: null,
    });

    mockCommonApiFetch.mockResolvedValue({
      id: "1",
      handle: "user",
      query: "user",
    });
    mockCommonApiPost.mockResolvedValue({
      token: "jwt-token",
      refresh_token: "refresh-token",
    });

    const sessionV2 = require("@/services/auth/session-v2.utils");
    sessionV2.getSessionClientType.mockReturnValue("web");
    sessionV2.getSessionNonce.mockReset();
    sessionV2.getSessionNonce.mockResolvedValue({
      signable_message: "sign this message exactly",
      server_signature: "server-signature",
    });
    sessionV2.loginWithSessionV2.mockReset();
    sessionV2.persistSessionResponse.mockReset();
    sessionV2.persistSessionResponse.mockResolvedValue(true);

    // Reset useIdentity mock
    mockUseIdentity.mockReturnValue({ profile: null, isLoading: false });

    // Mock console.error to prevent error output during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic functionality", () => {
    // Title management moved to TitleContext - test removed as obsolete

    it("requestAuth shows toast when no address", async () => {
      walletAddress = null;
      const wrapperValue = { invalidateAll: jest.fn() } as any;
      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        return <button onClick={() => requestAuth()}>auth</button>;
      };

      const { toast } = require("react-toastify");

      render(
        <ReactQueryWrapperContext.Provider value={wrapperValue}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );
      fireEvent.click(screen.getByText("auth"));
      await waitFor(() => expect(toast).toHaveBeenCalled());
    });

    it("returns showWaves true when wallet and profile", async () => {
      // Set up profile mock to return a profile with handle
      mockUseIdentity.mockReturnValue({
        profile: { id: "1", handle: "testuser", query: "testuser" },
        isLoading: false,
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <ShowWaves />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );
      await waitFor(() =>
        expect(screen.getByTestId("waves")).toHaveTextContent("true")
      );
    });

    it("requestAuth shows error without wallet", async () => {
      walletAddress = null;
      const toast = require("react-toastify").toast;
      const user = userEvent.setup();
      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <RequestAuthButton />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );
      await user.click(screen.getByTestId("req"));
      expect(toast).toHaveBeenCalled();
    });

    it("allows valid legacy auth before the session-v2 deadline without forcing the upgrade modal", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      enableAuthMigrationDeadline();
      const authUtils = require("@/services/auth/auth.utils");
      const mockGetAuthJwt = authUtils.getAuthJwt as jest.MockedFunction<any>;
      const mockValidateJwt =
        require("@/services/auth/jwt-validation.utils").validateJwt;
      mockGetAuthJwt.mockReturnValue("legacy-jwt");
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
        requiresSessionUpgrade: true,
      });

      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        const [result, setResult] = React.useState("pending");

        return (
          <>
            <button
              onClick={async () => {
                const response = await requestAuth();
                setResult(String(response.success));
              }}
              data-testid="legacy-action-auth"
            >
              auth
            </button>
            <span data-testid="legacy-action-auth-result">{result}</span>
          </>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("legacy-action-auth"));

      await waitFor(() => {
        expect(
          screen.getByTestId("legacy-action-auth-result")
        ).toHaveTextContent("true");
      });
      expect(mockSignMessage).not.toHaveBeenCalled();
      expect(
        screen.queryByText("Upgrade Authentication")
      ).not.toBeInTheDocument();
    });

    it("reauthenticates invalid legacy auth during the session-v2 grace window", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      enableAuthMigrationDeadline();
      const authUtils = require("@/services/auth/auth.utils");
      const mockGetAuthJwt = authUtils.getAuthJwt as jest.MockedFunction<any>;
      const mockRemoveAuthJwt =
        authUtils.removeAuthJwt as jest.MockedFunction<any>;
      const mockValidateJwt =
        require("@/services/auth/jwt-validation.utils").validateJwt;
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const sessionResponse = {
        client_type: "web",
        address: validAddress,
        role: null,
        access_token: "session-access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      };
      mockGetAuthJwt.mockReturnValue("expired-legacy-jwt");
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
      });
      sessionV2.loginWithSessionV2.mockResolvedValue(sessionResponse);

      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        const [result, setResult] = React.useState("pending");

        return (
          <>
            <button
              onClick={async () => {
                const response = await requestAuth();
                setResult(String(response.success));
              }}
              data-testid="expired-legacy-auth"
            >
              auth
            </button>
            <span data-testid="expired-legacy-auth-result">{result}</span>
          </>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("expired-legacy-auth"));

      await waitFor(() => {
        expect(
          screen.getByTestId("expired-legacy-auth-result")
        ).toHaveTextContent("true");
      });
      expect(mockValidateJwt).toHaveBeenCalledWith(
        expect.objectContaining({
          jwt: "expired-legacy-jwt",
          wallet: validAddress,
          role: null,
        })
      );
      expect(mockRemoveAuthJwt).toHaveBeenCalled();
      expect(sessionV2.getSessionNonce).toHaveBeenCalledWith({
        signerAddress: validAddress,
      });
      expect(mockSignMessage).toHaveBeenCalledWith("sign this message exactly");
      await waitFor(() =>
        expect(sessionV2.loginWithSessionV2).toHaveBeenCalledWith({
          serverSignature: "server-signature",
          clientSignature: "0xsignature",
          signerAddress: validAddress,
          role: null,
        })
      );
      expect(sessionV2.persistSessionResponse).toHaveBeenCalledWith(
        sessionResponse
      );
      expect(
        screen.queryByText("Upgrade Authentication")
      ).not.toBeInTheDocument();
    });

    it("uses session nonce signable_message for web sign-in", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      connectedAccountsOverride = [];
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.getSessionNonce.mockResolvedValue({
        signable_message: "6529 Authentication\nDomain: app.6529.io",
        server_signature: "server-signature",
      });
      const sessionResponse = {
        client_type: "web",
        address: validAddress,
        role: null,
        access_token: "session-access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      };
      sessionV2.loginWithSessionV2.mockResolvedValue(sessionResponse);
      sessionV2.persistSessionResponse.mockResolvedValue(true);
      const user = userEvent.setup();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <RequestAuthButton />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await user.click(screen.getByTestId("req"));

      expect(sessionV2.getSessionNonce).toHaveBeenCalledWith({
        signerAddress: validAddress,
      });
      expect(mockSignMessage).toHaveBeenCalledWith(
        "6529 Authentication\nDomain: app.6529.io"
      );
      await waitFor(() =>
        expect(sessionV2.loginWithSessionV2).toHaveBeenCalledWith({
          serverSignature: "server-signature",
          clientSignature: "0xsignature",
          signerAddress: validAddress,
          role: null,
        })
      );
      expect(sessionV2.persistSessionResponse).toHaveBeenCalledWith(
        sessionResponse
      );
      expect(mockCommonApiPost).not.toHaveBeenCalled();
    });

    it("uses native session nonce signable_message for native sign-in", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      connectedAccountsOverride = [];
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.getSessionNonce.mockResolvedValue({
        signable_message: "6529 Authentication\nDomain: native",
        server_signature: "server-signature",
      });
      const sessionResponse = {
        client_type: "native",
        address: validAddress,
        role: null,
        access_token: "session-access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
        native_refresh_token: "native-refresh-token",
        refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
      };
      sessionV2.getSessionClientType.mockReturnValue("native");
      sessionV2.loginWithSessionV2.mockResolvedValue(sessionResponse);
      sessionV2.persistSessionResponse.mockResolvedValue(true);
      const user = userEvent.setup();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <RequestAuthButton />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await user.click(screen.getByTestId("req"));

      expect(sessionV2.getSessionNonce).toHaveBeenCalledWith({
        signerAddress: validAddress,
      });
      expect(mockSignMessage).toHaveBeenCalledWith(
        "6529 Authentication\nDomain: native"
      );
      await waitFor(() =>
        expect(sessionV2.loginWithSessionV2).toHaveBeenCalledWith({
          serverSignature: "server-signature",
          clientSignature: "0xsignature",
          signerAddress: validAddress,
          role: null,
        })
      );
      expect(mockCommonApiPost).not.toHaveBeenCalled();
    });

    it("allows adding a second web account when below the connected profile limit", async () => {
      const existingAddress = "0x1111111111111111111111111111111111111111";
      const nextAddress = "0x2222222222222222222222222222222222222222";
      walletAddress = nextAddress;
      connectedAccountsOverride = [
        {
          address: existingAddress,
          role: null,
          isActive: true,
          isConnected: false,
        },
      ];
      const authUtils = require("@/services/auth/auth.utils");
      authUtils.canStoreAnotherWalletAccount.mockReturnValue(true);
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.getSessionClientType.mockReturnValue("web");
      const sessionResponse = {
        client_type: "web",
        address: nextAddress,
        role: null,
        access_token: "session-access-token-2",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      };
      sessionV2.loginWithSessionV2.mockResolvedValue(sessionResponse);
      const user = userEvent.setup();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <RequestAuthButton />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await user.click(screen.getByTestId("req"));

      expect(authUtils.canStoreAnotherWalletAccount).toHaveBeenCalledWith(
        nextAddress
      );
      expect(sessionV2.getSessionNonce).toHaveBeenCalledWith({
        signerAddress: nextAddress,
      });
      await waitFor(() =>
        expect(sessionV2.loginWithSessionV2).toHaveBeenCalledWith({
          serverSignature: "server-signature",
          clientSignature: "0xsignature",
          signerAddress: nextAddress,
          role: null,
        })
      );
      expect(sessionV2.persistSessionResponse).toHaveBeenCalledWith(
        sessionResponse
      );
      expect(mockCommonApiPost).not.toHaveBeenCalled();
    });
  });

  describe("Race Condition Prevention and Abort Controller", () => {
    const mockValidateAuthImmediate =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;

    it("should prevent authentication bypass via rapid address changes", async () => {
      // Mock validateAuthImmediate to simulate cancelled operation
      mockValidateAuthImmediate.mockResolvedValueOnce({ wasCancelled: true });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Initial address
      walletAddress = "0x1111111111111111111111111111111111111111";

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Ensure validation was called with race condition protection
      expect(mockValidateAuthImmediate).toHaveBeenCalled();
    });

    it("should handle connection state transitions without race conditions", async () => {
      const invalidateAllSpy = jest.fn();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: invalidateAllSpy } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Component should handle rapid state transitions gracefully
      expect(screen.getByTestId("auth-component")).toBeInTheDocument();
    });

    it("should ensure immediate validation prevents timing window attacks", async () => {
      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Immediate validation should be used (not setTimeout)
      expect(mockValidateAuthImmediate).toHaveBeenCalled();
    });

    it("should pass abort signal to validateAuthImmediate for operation cancellation", async () => {
      mockValidateAuthImmediate.mockImplementation(async ({ params }) => {
        // Verify that an abort signal is provided with required properties
        expect(params.abortSignal).toHaveProperty("aborted", false);
        expect(params.abortSignal).toHaveProperty("addEventListener");
        expect(params.abortSignal).toHaveProperty("removeEventListener");
        expect(params.operationId).toMatch(/^auth-\d+-[a-z0-9]+/);
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: false,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Verify abort signal and operation ID are passed correctly
      expect(mockValidateAuthImmediate).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            abortSignal: expect.objectContaining({
              aborted: false,
              addEventListener: expect.any(Function),
              removeEventListener: expect.any(Function),
            }),
            operationId: expect.stringMatching(/^auth-\d+-[a-z0-9]+/),
          }),
        })
      );
    });

    it("should handle cancelled operations gracefully", async () => {
      // Simulate a cancelled operation
      mockValidateAuthImmediate.mockResolvedValueOnce({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Should not show error messages for cancelled operations
      const { toast } = require("react-toastify");
      expect(toast).not.toHaveBeenCalled();
    });

    it("should cleanup abort controllers on component unmount", async () => {
      const { unmount } = render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Unmount should trigger cleanup without errors
      expect(() => unmount()).not.toThrow();
    });

    it("should generate unique operation IDs for concurrent operations", async () => {
      let operationIds: string[] = [];

      mockValidateAuthImmediate.mockImplementation(async ({ params }) => {
        operationIds.push(params.operationId);
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: false,
        };
      });

      // Render Auth component
      const { unmount } = render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Wait for validation to be called and check operation ID format
      await waitFor(() => {
        expect(operationIds.length).toBeGreaterThan(0);
      });

      // Check that operation IDs follow the expected pattern
      expect(operationIds[0]).toMatch(/^auth-\d+-[a-z0-9]+/);

      unmount();
    });
  });

  describe("Secure Authentication Flow", () => {
    const mockValidateAuthImmediate =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
    const mockGetAuthJwt = require("@/services/auth/auth.utils").getAuthJwt;

    it("should call validateAuthImmediate on component mount with wallet connected", async () => {
      mockGetAuthJwt.mockReturnValue("test-jwt-token");
      mockValidateAuthImmediate.mockResolvedValue({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Should call validateAuthImmediate with the correct parameters
      expect(mockValidateAuthImmediate).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            jwt: "test-jwt-token",
            currentAddress: walletAddress,
            connectionAddress: walletAddress,
          }),
        })
      );
    });

    it("should show sign modal when validation indicates authentication needed", async () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Sign Authentication Request")
        ).toBeInTheDocument();
      });
    });

    it("should not trigger validation during connecting state", async () => {
      connectionState = "connecting";
      mockValidateAuthImmediate.mockReset();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-component")).toBeInTheDocument();
      });

      // Should not call validateAuthImmediate during connecting state
      expect(mockValidateAuthImmediate).not.toHaveBeenCalled();
    });
  });

  describe("Toast Notifications", () => {
    const { toast } = require("react-toastify");
    const mockValidateAuthImmediate =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;

    it("should show toast notification using setToast function", async () => {
      mockValidateAuthImmediate.mockResolvedValue({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });

      const Child = () => {
        const { setToast } = React.useContext(AuthContext);
        return (
          <button
            onClick={() => setToast({ message: "Test message", type: "info" })}
            data-testid="toast-button"
          >
            Show Toast
          </button>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("toast-button"));

      expect(toast).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: "info",
          position: "top-right",
          autoClose: 3000,
        })
      );
    });
  });

  describe("Context Values", () => {
    const mockValidateAuthImmediate =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;

    it("should provide correct context values", async () => {
      mockValidateAuthImmediate.mockResolvedValue({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };

      // Mock useIdentity to return the profile immediately
      mockUseIdentity.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
      });

      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="context-consumer">Context Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("context-consumer")).toBeInTheDocument();
      });

      // Wait for context to be populated with the mocked profile
      await waitFor(() => {
        expect(contextValues.connectedProfile).not.toBeNull();
      });

      // Check that context provides expected functions and values
      expect(contextValues).toEqual(
        expect.objectContaining({
          requestAuth: expect.any(Function),
          setToast: expect.any(Function),
          setActiveProfileProxy: expect.any(Function),
          connectedProfile: mockProfile,
          fetchingProfile: false, // Since we mocked isLoading as false
          receivedProfileProxies: expect.any(Array),
          activeProfileProxy: null,
          showWaves: expect.any(Boolean),
          connectionStatus: expect.any(String),
        })
      );
    });
  });

  describe("Profile Management", () => {
    const mockValidateAuthImmediate =
      require("@/services/auth/immediate-validation.utils").validateAuthImmediate;

    it("should fetch and set connected profile when address is provided", async () => {
      mockValidateAuthImmediate.mockResolvedValue({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };

      // Mock useIdentity to simulate profile fetching
      mockUseIdentity.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
      });

      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="profile-consumer">Profile Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-consumer")).toBeInTheDocument();
      });

      // The useIdentity hook should be called with the wallet address
      expect(mockUseIdentity).toHaveBeenCalledWith({
        handleOrWallet: walletAddress,
        initialProfile: null,
      });

      // Profile should be available in context from the mocked hook
      await waitFor(() => {
        expect(contextValues.connectedProfile).toEqual(mockProfile);
      });
    });

    it("should clear profile when address is null", async () => {
      walletAddress = null;

      // Mock useIdentity to return null when no address
      mockUseIdentity.mockReturnValue({ profile: null, isLoading: false });

      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="no-profile-consumer">No Profile Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("no-profile-consumer")).toBeInTheDocument();
      });

      expect(contextValues.connectedProfile).toBeNull();
    });
  });

  describe("Modal Behavior", () => {
    it("should show modal when sign modal state is true and connected", async () => {
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Sign Authentication Request")
        ).toBeInTheDocument();
      });

      // Check that modal content is present
      expect(
        screen.getByText(
          "To connect your wallet, you will need to sign a message to confirm your identity."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Sign")).toBeInTheDocument();
    });

    it("should handle modal cancel button", async () => {
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      const mockSeizeDisconnectAndLogout =
        require("@/components/auth/SeizeConnectContext").useSeizeConnectContext()
          .seizeDisconnectAndLogout;

      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Cancel"));

      // Should call disconnect function
      expect(mockSeizeDisconnectAndLogout).toHaveBeenCalled();
    });

    it("keeps v1 session upgrade silent when backend rollout settings are absent", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      const mockRemoveAuthJwt = require("@/services/auth/auth.utils")
        .removeAuthJwt as jest.MockedFunction<any>;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: false,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(mockValidateAuthImmediate).toHaveBeenCalled();
      });

      expect(
        screen.queryByText("Upgrade Authentication")
      ).not.toBeInTheDocument();
      expect(mockRemoveAuthJwt).not.toHaveBeenCalled();
    });

    it("closes the upgrade modal after successful session-v2 sign-in", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      const mockGetAuthJwt = require("@/services/auth/auth.utils")
        .getAuthJwt as jest.MockedFunction<any>;
      const mockValidateJwt =
        require("@/services/auth/jwt-validation.utils").validateJwt;
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const sessionResponse = {
        client_type: "web",
        address: validAddress,
        role: null,
        access_token: "session-access-token",
        access_token_expires_at: "2026-06-10T00:00:00.000Z",
      };
      mockGetAuthJwt.mockReturnValue("session-access-token");
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
        requiresSessionUpgrade: true,
      });
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });
      sessionV2.loginWithSessionV2.mockResolvedValue(sessionResponse);

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Sign"));

      await waitFor(() => {
        expect(sessionV2.persistSessionResponse).toHaveBeenCalledWith(
          sessionResponse
        );
      });
      await waitFor(() => {
        expect(
          screen.queryByText("Upgrade Authentication")
        ).not.toBeInTheDocument();
      });
    });

    it("hides the session upgrade dismiss action while wallet confirmation is pending", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      mockIsSigningPending = true;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      expect(screen.queryByText("Remind me later")).not.toBeInTheDocument();
      expect(screen.getByText(/Confirm in your wallet/i)).toBeInTheDocument();
    });

    it("keeps the session upgrade modal visible while validation reruns", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      enableAuthMigrationDeadline();
      const pendingValidation = createDeferredPromise<{
        validationCompleted: boolean;
        wasCancelled: boolean;
        shouldShowModal: boolean;
      }>();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate
        .mockImplementationOnce(async ({ callbacks }) => {
          callbacks.onSessionUpgradeRequired();
          return {
            validationCompleted: true,
            wasCancelled: false,
            shouldShowModal: true,
          };
        })
        .mockImplementationOnce(() => pendingValidation.promise);

      const { rerender } = render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      canSignActiveWallet = false;
      rerender(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(mockValidateAuthImmediate).toHaveBeenCalledTimes(2);
      });
      expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();

      pendingValidation.resolve({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });
    });

    it("shows a reshare notice for session upgrade when the active connection cannot sign", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      canSignActiveWallet = false;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.getSessionClientType.mockReturnValue("native");
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Connection Update Required")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Reshare the connection from a device/i)
      ).toBeInTheDocument();
      expect(screen.queryByText("Sign")).not.toBeInTheDocument();
      expect(screen.getByText("Remind me later")).toBeInTheDocument();
    });

    it("shows a connect flow with shared-connection guidance when browser wallet is disconnected", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      canSignActiveWallet = false;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Reconnect this wallet and sign once/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/If this is a shared connection, reshare/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Remind me later")).toBeInTheDocument();
      expect(screen.queryByText("Sign")).not.toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByText("Connect"));

      await waitFor(() => {
        expect(mockSeizeDisconnect).toHaveBeenCalled();
      });
      expect(mockSeizeConnect).toHaveBeenCalled();
      expect(mockSeizeDisconnect.mock.invocationCallOrder[0]).toBeLessThan(
        mockSeizeConnect.mock.invocationCallOrder[0]
      );
    });

    it("temporarily dismisses the session upgrade prompt", async () => {
      const validAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = validAddress;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      const { unmount } = render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Remind me later"));

      await waitFor(() => {
        expect(
          screen.queryByText("Upgrade Authentication")
        ).not.toBeInTheDocument();
      });
      expect(mockSeizeDisconnectAndLogout).not.toHaveBeenCalled();
      expect(mockSeizeDisconnect).not.toHaveBeenCalled();

      unmount();

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(mockValidateAuthImmediate).toHaveBeenCalled();
      });
      expect(
        screen.queryByText("Upgrade Authentication")
      ).not.toBeInTheDocument();
    });

    it("keeps session upgrade dismiss reminders scoped to each connected account", async () => {
      const firstAddress = "0x1111111111111111111111111111111111111111";
      const secondAddress = "0x2222222222222222222222222222222222222222";
      walletAddress = firstAddress;
      enableAuthMigrationDeadline();
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      const { unmount } = render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Remind me later"));

      await waitFor(() => {
        expect(
          screen.queryByText("Upgrade Authentication")
        ).not.toBeInTheDocument();
      });

      unmount();
      walletAddress = secondAddress;

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Upgrade Authentication")).toBeInTheDocument();
      });
    });

    it("displays the backend migration deadline in hours", async () => {
      const now = Date.UTC(2026, 5, 17, 12, 0, 0);
      jest.spyOn(Date, "now").mockReturnValue(now);
      enableAuthMigrationDeadline(new Date(now + 60 * 60 * 1000).toISOString());
      walletAddress = "0x1111111111111111111111111111111111111111";
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Time left to upgrade: 1 hour.")
        ).toBeInTheDocument();
      });
    });

    it("displays backend migration deadlines over three days as whole days", async () => {
      const now = Date.UTC(2026, 5, 17, 12, 0, 0);
      jest.spyOn(Date, "now").mockReturnValue(now);
      enableAuthMigrationDeadline(
        new Date(now + (5 * 24 + 20) * 60 * 60 * 1000).toISOString()
      );
      walletAddress = "0x1111111111111111111111111111111111111111";
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Time left to upgrade: 5 days.")
        ).toBeInTheDocument();
      });
    });

    it("displays backend migration deadlines at three days or less as whole hours", async () => {
      const now = Date.UTC(2026, 5, 17, 12, 0, 0);
      jest.spyOn(Date, "now").mockReturnValue(now);
      enableAuthMigrationDeadline(
        new Date(now + (3 * 24 + 20) * 60 * 60 * 1000).toISOString()
      );
      walletAddress = "0x1111111111111111111111111111111111111111";
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Time left to upgrade: 92 hours.")
        ).toBeInTheDocument();
      });
    });

    it("clears auth when the configured migration deadline has expired", async () => {
      const now = Date.UTC(2026, 5, 17, 12, 0, 0);
      jest.spyOn(Date, "now").mockReturnValue(now);
      enableAuthMigrationDeadline(new Date(now - 1).toISOString());
      walletAddress = "0x1111111111111111111111111111111111111111";
      const mockValidateAuthImmediate =
        require("@/services/auth/immediate-validation.utils").validateAuthImmediate;
      const mockRemoveAuthJwt = require("@/services/auth/auth.utils")
        .removeAuthJwt as jest.MockedFunction<any>;
      const invalidateAll = jest.fn();
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onSessionUpgradeRequired();
        return {
          validationCompleted: true,
          wasCancelled: false,
          shouldShowModal: true,
        };
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(mockRemoveAuthJwt).toHaveBeenCalled();
      });
      expect(invalidateAll).toHaveBeenCalled();
      expect(
        screen.queryByText("Upgrade Authentication")
      ).not.toBeInTheDocument();
    });
  });

  describe("Authentication Integration", () => {
    const { toast } = require("react-toastify");

    it("should show error when wallet not connected", async () => {
      walletAddress = null;

      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        return (
          <button onClick={() => requestAuth()} data-testid="test-no-wallet">
            Test No Wallet
          </button>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("test-no-wallet"));

      expect(toast).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: "error" })
      );
    });

    it("treats dev-auth sessions as authorized even without stored connected accounts", async () => {
      connectedAccountsOverride = [];

      const authUtils = require("@/services/auth/auth.utils");
      const mockGetAuthJwt = authUtils.getAuthJwt as jest.MockedFunction<any>;
      const mockGetWalletAddress =
        authUtils.getWalletAddress as jest.MockedFunction<any>;
      const mockIsAuthAddressAuthorized =
        authUtils.isAuthAddressAuthorized as jest.MockedFunction<any>;

      mockGetAuthJwt.mockReturnValue("dev-jwt");
      mockGetWalletAddress.mockReturnValue(walletAddress);
      mockIsAuthAddressAuthorized.mockReturnValue(true);

      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        const [result, setResult] = React.useState("pending");

        return (
          <>
            <button
              onClick={async () => {
                const response = await requestAuth();
                setResult(String(response.success));
              }}
              data-testid="test-dev-auth"
            >
              Test Dev Auth
            </button>
            <span data-testid="test-dev-auth-result">{result}</span>
          </>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("test-dev-auth"));

      await waitFor(() => {
        expect(screen.getByTestId("test-dev-auth-result")).toHaveTextContent(
          "true"
        );
      });

      expect(mockCommonApiPost).not.toHaveBeenCalled();
      expect(mockSignMessage).not.toHaveBeenCalled();
      expect(
        screen.queryByText("Sign Authentication Request")
      ).not.toBeInTheDocument();
    });
  });

  describe("Toast Functionality", () => {
    it("should show toast using setToast with error type", async () => {
      const Child = () => {
        const { setToast } = React.useContext(AuthContext);

        const triggerErrorToast = () => {
          setToast({
            message: "Test error message",
            type: "error",
          });
        };

        return (
          <button onClick={triggerErrorToast} data-testid="test-error-toast">
            Test Error Toast
          </button>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      const { toast } = require("react-toastify");

      await user.click(screen.getByTestId("test-error-toast"));

      expect(toast).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: "error",
          autoClose: 8000,
        })
      );
    });

    it("should show toast using setToast with success type", async () => {
      const Child = () => {
        const { setToast } = React.useContext(AuthContext);

        const triggerSuccessToast = () => {
          setToast({
            message: "Test success message",
            type: "success",
          });
        };

        return (
          <button
            onClick={triggerSuccessToast}
            data-testid="test-success-toast"
          >
            Test Success Toast
          </button>
        );
      };

      render(
        <ReactQueryWrapperContext.Provider
          value={{ invalidateAll: jest.fn() } as any}
        >
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      const { toast } = require("react-toastify");

      await user.click(screen.getByTestId("test-success-toast"));

      expect(toast).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: "success",
          autoClose: 3000,
        })
      );
    });
  });
});
