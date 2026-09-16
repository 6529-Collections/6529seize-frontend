import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WebSidebarUser from "@/components/layout/sidebar/WebSidebarUser";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import { getDocumentationProfiles } from "@/services/api/artwork-documentation-api";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  getDocumentationProfiles: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/isMobileDevice", () => ({
  useIsMobileDeviceStatus: () => ({
    isMobileDevice: false,
    isDeviceDetectionResolved: true,
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  HeaderConnectModal: () => null,
}));
jest.mock("@/components/user/utils/level/UserLevel", () => () => null);
jest.mock("@/components/header/user/HeaderUserMenuDropdown", () => {
  return {
    __esModule: true,
    default: ({
      artworkDocumentationEnabled,
    }: {
      artworkDocumentationEnabled: boolean;
    }) => {
      return (
        <div role="dialog">
          {artworkDocumentationEnabled && <span>Documentation</span>}
        </div>
      );
    },
  };
});

const alice = {
  id: "alice",
  handle: "alice",
  pfp: null,
  level: 1,
} as ApiIdentity;
const refetch = jest.fn();
const connect = jest.fn();
const freshConnect = jest.fn().mockResolvedValue(undefined);
let queryClient: QueryClient;

function setAccount(
  address: string | undefined,
  connectionState = "connected"
) {
  jest.mocked(useSeizeConnectContext).mockReturnValue({
    address,
    connectionState,
    hasValidWalletAuth: !!address,
    isConnected: false,
    connectedAccounts: [],
    connectedAccountUnreadNotifications: {},
    seizeConnect: connect,
    seizeConnectFresh: freshConnect,
    seizeSwitchConnectedAccount: jest.fn(),
  } as unknown as ReturnType<typeof useSeizeConnectContext>);
}

function accountUi(collapsed = true) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSidebarUser isCollapsed={collapsed} profile={null} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  setAccount("0xalice");
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: alice,
    activeProfileProxy: null,
    isAuthenticated: true,
    setToast: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  jest.mocked(useIdentity).mockReturnValue({
    profile: alice,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useIdentity>);
  jest.mocked(getDocumentationProfiles).mockResolvedValue({
    enabled: true,
    self_service_enabled: false,
    profiles: [],
  });
});
afterEach(() => queryClient.clear());

it("distinguishes initializing from signed out and keeps the same account footprint", () => {
  setAccount(undefined, "initializing");
  const { container, rerender } = render(accountUi());
  const loadingClasses = container.firstElementChild?.className;
  expect(
    screen.getByRole("status", { name: "Loading account" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Connect Wallet" })
  ).not.toBeInTheDocument();
  setAccount(undefined, "disconnected");
  rerender(accountUi(false));
  expect(container.firstElementChild?.className).toBe(loadingClasses);
  fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
  expect(freshConnect).toHaveBeenCalledTimes(1);
  setAccount("0xalice");
  rerender(accountUi());
  expect(container.firstElementChild?.className).toBe(loadingClasses);
});

it("preserves fresh-wallet selection on the expanded connect control", () => {
  setAccount(undefined, "disconnected");
  render(accountUi(false));
  fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
  expect(freshConnect).toHaveBeenCalledTimes(1);
});

it("offers retry instead of an endless skeleton when profile loading fails", () => {
  jest.mocked(useIdentity).mockReturnValue({
    profile: null,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useIdentity>);
  render(accountUi());
  fireEvent.click(
    screen.getByRole("button", { name: "Profile unavailable. Retry" })
  );
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("starts availability before opening and does not repeat its request across menu openings", async () => {
  render(accountUi());
  await waitFor(() =>
    expect(getDocumentationProfiles).toHaveBeenCalledTimes(1)
  );
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  const button = screen.getByRole("button", {
    name: "Open account and profiles menu",
  });
  fireEvent.click(button);
  expect(screen.getByText("Documentation")).toBeInTheDocument();
  fireEvent.click(button);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  fireEvent.click(button);
  expect(screen.getByText("Documentation")).toBeInTheDocument();
  expect(getDocumentationProfiles).toHaveBeenCalledTimes(1);
});

it("does not carry documentation visibility across account changes", async () => {
  const { rerender } = render(accountUi());
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  fireEvent.click(
    screen.getByRole("button", { name: "Open account and profiles menu" })
  );
  await waitFor(() =>
    expect(screen.getByText("Documentation")).toBeInTheDocument()
  );
  const bob = { ...alice, id: "bob", handle: "bob" };
  setAccount("0xbob");
  jest.mocked(useIdentity).mockReturnValue({
    profile: bob,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useIdentity>);
  // Auth's profile may still be catching up to the selected wallet.
  rerender(accountUi(false));
  expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
});

it("drops the previous account's access result on logout even if its profile is still present", async () => {
  const { rerender } = render(accountUi());
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  setAccount(undefined, "disconnected");
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: alice,
    activeProfileProxy: null,
    isAuthenticated: false,
    setToast: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  rerender(accountUi(false));
  await waitFor(() =>
    expect(
      queryClient.getQueryData([
        "artwork-documentation",
        "alice",
        "access",
        "direct",
      ])
    ).toBeUndefined()
  );
  expect(getDocumentationProfiles).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Connect Wallet" })
  ).toBeInTheDocument();
});

it("checks proxy access separately without showing the direct account's artwork item", async () => {
  const { rerender } = render(accountUi());
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  fireEvent.click(
    screen.getByRole("button", { name: "Open account and profiles menu" })
  );
  await waitFor(() =>
    expect(screen.getByText("Documentation")).toBeInTheDocument()
  );
  jest.mocked(getDocumentationProfiles).mockResolvedValue({
    enabled: false,
    self_service_enabled: false,
    profiles: [],
  });
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: alice,
    activeProfileProxy: { id: "proxy" },
    isAuthenticated: true,
    setToast: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  rerender(accountUi(false));
  expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(getDocumentationProfiles).toHaveBeenCalledTimes(2)
  );
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
});
