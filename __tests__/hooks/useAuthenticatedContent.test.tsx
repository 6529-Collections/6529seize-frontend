import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useAuthenticatedContent } from "@/hooks/useAuthenticatedContent";

const mockUseSeizeConnectContext = jest.fn();
const mockUseLayout = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => mockUseLayout(),
}));

const defaultAuthValue = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: "NOT_CONNECTED",
  showWaves: false,
  requestAuth: jest.fn(async () => ({ success: false })),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(async () => {}),
};

const renderUseAuthenticatedContent = (
  authValue: Partial<typeof defaultAuthValue>
) =>
  renderHook(() => useAuthenticatedContent(), {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <AuthContext.Provider
        value={{ ...defaultAuthValue, ...authValue } as any}
      >
        {children}
      </AuthContext.Provider>
    ),
  });

describe("useAuthenticatedContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLayout.mockReturnValue({
      spaces: {
        measurementsComplete: true,
      },
    });
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0x1",
      isAuthenticated: true,
    });
  });

  it("shows profile setup when an authenticated connected account has no profile", () => {
    const { result } = renderUseAuthenticatedContent({
      connectedProfile: null,
      isAuthenticated: false,
      fetchingProfile: false,
      showWaves: false,
    });

    expect(result.current.contentState).toBe("needs-profile");
  });

  it("stays loading while profile data is still settling", () => {
    const { result } = renderUseAuthenticatedContent({
      connectedProfile: null,
      isAuthenticated: false,
      fetchingProfile: true,
      showWaves: false,
    });

    expect(result.current.contentState).toBe("loading");
  });
});
