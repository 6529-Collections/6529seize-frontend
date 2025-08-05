import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import UserPageWavesWrapper from "@/components/user/waves/UserPageWavesWrapper";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));

jest.mock(
  "@/components/user/waves/UserPageWaves",
  () =>
    function MockUserPageWaves({ profile }: { profile: ApiIdentity }) {
      return (
        <div
          data-testid="user-page-waves"
          data-profile-handle={profile.handle}
        />
      );
    }
);

describe("UserPageWavesWrapper", () => {
  const useRouterMock = useRouter as jest.Mock;
  const useSeizeConnectContextMock = useSeizeConnectContext as jest.Mock;
  const useIdentityMock = useIdentity as jest.Mock;
  const mockPush = jest.fn();

  const mockProfile: ApiIdentity = {
    handle: "testuser",
  } as ApiIdentity;

  const mockUpdatedProfile: ApiIdentity = {
    handle: "testuser-updated",
  } as ApiIdentity;

  beforeEach(() => {
    useRouterMock.mockReturnValue({
      query: { user: "testuser" },
      push: mockPush,
    });

    useSeizeConnectContextMock.mockReturnValue({
      address: "0x123",
    });

    useIdentityMock.mockReturnValue({
      profile: mockUpdatedProfile,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (authOverrides = {}) => {
    const authContext = createMockAuthContext({
      showWaves: true,
      ...authOverrides,
    });

    return render(
      <AuthContext.Provider value={authContext}>
        <UserPageWavesWrapper profile={mockProfile} />
      </AuthContext.Provider>
    );
  };

  it("renders UserPageWaves when showWaves is true", () => {
    renderComponent();
    expect(screen.getByTestId("user-page-waves")).toBeInTheDocument();
  });

  it("uses updated profile from useIdentity hook", () => {
    renderComponent();
    expect(screen.getByTestId("user-page-waves")).toHaveAttribute(
      "data-profile-handle",
      "testuser-updated"
    );
  });

  it("falls back to initial profile when useIdentity returns null", () => {
    useIdentityMock.mockReturnValue({ profile: null });

    renderComponent();
    expect(screen.getByTestId("user-page-waves")).toHaveAttribute(
      "data-profile-handle",
      "testuser"
    );
  });

  it("returns null when showWaves is false", () => {
    const { container } = renderComponent({ showWaves: false });
    expect(container.firstChild).toBeNull();
  });

  it("redirects to rep page when showWaves is false and connectedProfile exists", () => {
    renderComponent({
      showWaves: false,
      connectedProfile: { handle: "connected" },
    });

    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");
  });

  it("redirects to rep page when showWaves is false and no address", () => {
    useSeizeConnectContextMock.mockReturnValue({ address: null });

    renderComponent({
      showWaves: false,
      connectedProfile: null,
    });

    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");
  });

  it("redirects when showWaves is false but no connectedProfile and has address", () => {
    renderComponent({
      showWaves: false,
      connectedProfile: null,
    });

    expect(mockPush).toHaveBeenCalled();
  });

  it("calls useIdentity with correct parameters", () => {
    renderComponent();

    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "testuser",
      initialProfile: mockProfile,
    });
  });

  it("handles user query parameter case conversion", () => {
    useRouterMock.mockReturnValue({
      query: { user: "TestUser" },
      push: mockPush,
    });

    renderComponent();

    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "testuser",
      initialProfile: mockProfile,
    });
  });

  it("redirects when connected profile changes and showWaves is false", () => {
    const { rerender } = renderComponent({
      showWaves: false,
      connectedProfile: null,
    });

    // Initial render should not redirect
    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");

    // Update with connected profile
    const updatedAuthContext = createMockAuthContext({
      showWaves: false,
      connectedProfile: { handle: "connected" },
    });

    rerender(
      <AuthContext.Provider value={updatedAuthContext}>
        <UserPageWavesWrapper profile={mockProfile} />
      </AuthContext.Provider>
    );

    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");
  });

  it("redirects when address changes and showWaves is false", () => {
    // Start with address
    useSeizeConnectContextMock.mockReturnValue({ address: "0x123" });

    const { rerender } = renderComponent({
      showWaves: false,
      connectedProfile: null,
    });

    // Initial render should not redirect
    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");

    // Update without address
    useSeizeConnectContextMock.mockReturnValue({ address: null });

    rerender(
      <AuthContext.Provider
        value={createMockAuthContext({
          showWaves: false,
          connectedProfile: null,
        })}>
        <UserPageWavesWrapper profile={mockProfile} />
      </AuthContext.Provider>
    );

    expect(mockPush).toHaveBeenCalledWith("/testuser/rep");
  });
});
