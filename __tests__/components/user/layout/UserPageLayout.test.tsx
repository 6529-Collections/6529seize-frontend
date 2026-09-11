import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import { TitleProvider } from "@/contexts/TitleContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock(
  "@/components/user/user-page-header/UserPageHeader",
  () =>
    function MockHeader({
      fallbackMainAddress,
    }: {
      readonly fallbackMainAddress: string;
    }) {
      return (
        <div
          data-testid="user-page-header"
          data-fallback-main-address={fallbackMainAddress}
        />
      );
    }
);
jest.mock(
  "@/components/user/layout/UserPageTabs",
  () =>
    function MockTabs() {
      return <div data-testid="user-page-tabs" />;
    }
);

const mockProfile: ApiIdentity = {
  handle: "testuser",
  primary_wallet: "0x1",
} as any;
const mockAuthContext = {} as any;
const mockReactQueryContext = { setProfile: jest.fn() } as any;
const mockUseParams = useParams as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

describe("UserPageLayout", () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ user: "testuser" });
    mockUsePathname.mockReturnValue("/testuser");
    mockUseRouter.mockReturnValue({ push: jest.fn(), replace: jest.fn() });
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  const renderComponent = (
    profile: ApiIdentity = mockProfile,
    handleOrWallet = "testuser"
  ) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <TitleProvider>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthContext}>
            <ReactQueryWrapperContext.Provider value={mockReactQueryContext}>
              <UserPageLayout
                profile={profile}
                handleOrWallet={handleOrWallet}
              >
                <div>Content</div>
              </UserPageLayout>
            </ReactQueryWrapperContext.Provider>
          </AuthContext.Provider>
        </QueryClientProvider>
      </TitleProvider>
    );
  };

  it("renders header, tabs and children", () => {
    renderComponent();
    expect(screen.getByTestId("user-page-header")).toBeInTheDocument();
    expect(screen.getByTestId("user-page-tabs")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("sets profile in context when not cached", async () => {
    renderComponent();
    await waitFor(() =>
      expect(mockReactQueryContext.setProfile).toHaveBeenCalledWith(mockProfile)
    );
  });

  it("uses the normalized route identity when a primary wallet is absent", () => {
    renderComponent(
      { ...mockProfile, primary_wallet: undefined as unknown as string },
      "WalletlessProfile"
    );

    expect(screen.getByTestId("user-page-header")).toHaveAttribute(
      "data-fallback-main-address",
      "walletlessprofile"
    );
  });
});
