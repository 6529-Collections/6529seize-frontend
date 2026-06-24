import { AuthContext } from "@/components/auth/Auth";
import { useAuthenticatedContent } from "@/hooks/useAuthenticatedContent";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

const mockUseLayout = jest.fn();
const mockUseSeizeConnectContext = jest.fn();

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => mockUseLayout(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));

const defaultAuthContext = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  connectionStatus: "DISCONNECTED",
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  sessionUpgradeRequired: false,
  requestAuth: jest.fn(),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(),
};

const createWrapper =
  (authContext: Partial<typeof defaultAuthContext> = {}) =>
  ({ children }: { readonly children: ReactNode }) => (
    <AuthContext.Provider
      value={{ ...defaultAuthContext, ...authContext } as any}
    >
      {children}
    </AuthContext.Provider>
  );

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
});
