import { AuthContext } from "@/components/auth/Auth";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useAuthenticatedContent } from "@/hooks/useAuthenticatedContent";
import { renderHook } from "@testing-library/react";
import type { ContextType, ReactNode } from "react";

const mockUseLayout = jest.fn();
const mockUseSeizeConnectContext = jest.fn();

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => mockUseLayout(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));

type AuthContextValue = ContextType<typeof AuthContext>;

const createConnectedProfile = (handle: string): ApiIdentity =>
  Object.assign(new ApiIdentity(), {
    id: "profile-1",
    handle,
    query: handle,
  });

const defaultAuthContext: AuthContextValue = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  sessionUpgradeRequired: false,
  requestAuth: jest.fn(async () => ({ success: false })),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(async () => undefined),
};

const createWrapper =
  (authContext: Partial<AuthContextValue> = {}) =>
  ({ children }: { readonly children: ReactNode }) => (
    <AuthContext.Provider value={{ ...defaultAuthContext, ...authContext }}>
      {children}
    </AuthContext.Provider>
  );

function renderContentState({
  authContext = {},
  walletContext = {
    address: "0xabc",
    hasValidWalletAuth: true,
  },
  measurementsComplete = true,
}: {
  readonly authContext?: Partial<AuthContextValue>;
  readonly walletContext?: {
    readonly address: string | null;
    readonly hasValidWalletAuth: boolean;
  };
  readonly measurementsComplete?: boolean;
}) {
  mockUseLayout.mockReturnValue({ spaces: { measurementsComplete } });
  mockUseSeizeConnectContext.mockReturnValue(walletContext);

  const { result, unmount } = renderHook(() => useAuthenticatedContent(), {
    wrapper: createWrapper(authContext),
  });

  const contentState = result.current.contentState;
  unmount();

  return contentState;
}

describe("useAuthenticatedContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLayout.mockReturnValue({ spaces: { measurementsComplete: true } });
    mockUseSeizeConnectContext.mockReturnValue({
      address: null,
      hasValidWalletAuth: false,
    });
  });

  it("returns not-authenticated for connected wallets with invalid auth after profile loading settles", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0xabc",
      hasValidWalletAuth: false,
    });

    const { result } = renderHook(() => useAuthenticatedContent(), {
      wrapper: createWrapper({
        connectedProfile: null,
        fetchingProfile: false,
        isAuthenticated: false,
        showWaves: false,
      }),
    });

    expect(result.current.contentState).toBe("not-authenticated");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("does not let stale authenticated state override invalid wallet auth", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0xabc",
      hasValidWalletAuth: false,
    });

    const { result } = renderHook(() => useAuthenticatedContent(), {
      wrapper: createWrapper({
        connectedProfile: createConnectedProfile("alice"),
        fetchingProfile: false,
        isAuthenticated: true,
        showWaves: true,
      }),
    });

    expect(result.current.contentState).toBe("not-authenticated");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("keeps invalid-auth wallets loading while profile loading is still settling", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0xabc",
      hasValidWalletAuth: false,
    });

    const { result } = renderHook(() => useAuthenticatedContent(), {
      wrapper: createWrapper({
        connectedProfile: null,
        fetchingProfile: true,
        isAuthenticated: false,
        showWaves: false,
      }),
    });

    expect(result.current.contentState).toBe("loading");
  });

  it("keeps auth and availability gates ahead of layout measurement", () => {
    const readyProfileContext: Partial<AuthContextValue> = {
      connectedProfile: createConnectedProfile("alice"),
      fetchingProfile: false,
      isAuthenticated: true,
      showWaves: true,
    };

    expect(
      renderContentState({
        authContext: readyProfileContext,
        walletContext: { address: null, hasValidWalletAuth: false },
        measurementsComplete: false,
      })
    ).toBe("not-authenticated");

    expect(
      renderContentState({
        authContext: readyProfileContext,
        walletContext: { address: "0xabc", hasValidWalletAuth: false },
        measurementsComplete: false,
      })
    ).toBe("not-authenticated");

    expect(
      renderContentState({
        authContext: {
          connectedProfile: null,
          fetchingProfile: true,
          isAuthenticated: false,
          showWaves: false,
        },
        walletContext: { address: "0xabc", hasValidWalletAuth: false },
        measurementsComplete: false,
      })
    ).toBe("loading");

    expect(
      renderContentState({
        authContext: {
          connectedProfile: null,
          fetchingProfile: false,
          isAuthenticated: false,
          showWaves: false,
        },
        measurementsComplete: false,
      })
    ).toBe("needs-profile");

    expect(
      renderContentState({
        authContext: {
          ...readyProfileContext,
          showWaves: false,
        },
        measurementsComplete: false,
      })
    ).toBe("not-available");
  });

  it("returns measuring only after authenticated Waves content is allowed", () => {
    const authContext: Partial<AuthContextValue> = {
      connectedProfile: createConnectedProfile("alice"),
      fetchingProfile: false,
      isAuthenticated: true,
      showWaves: true,
    };

    expect(
      renderContentState({
        authContext,
        measurementsComplete: false,
      })
    ).toBe("measuring");

    expect(
      renderContentState({
        authContext,
        measurementsComplete: true,
      })
    ).toBe("ready");
  });
});
