import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import WebSidebarUser from "@/components/layout/sidebar/WebSidebarUser";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSidebarIdentity } from "@/components/layout/sidebar/useSidebarIdentity";
import { getDocumentationProfiles } from "@/services/api/artwork-documentation-api";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/layout/sidebar/useSidebarIdentity", () => ({
  useSidebarIdentity: jest.fn(),
}));
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
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: alice,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
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
  const icon = screen
    .getByRole("button", { name: "Connect Wallet" })
    .querySelector("svg");
  expect(icon).toHaveClass("tw-size-6");
  expect(icon?.parentElement).toHaveClass(
    "tw-size-10",
    "tw-rounded-xl",
    "tw-ring-white/10"
  );
  fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
  expect(freshConnect).toHaveBeenCalledTimes(1);
  setAccount("0xalice");
  rerender(accountUi());
  expect(container.firstElementChild?.className).toBe(loadingClasses);
});

it("hydrates the loading account before revealing a stored profile", async () => {
  setAccount(undefined, "initializing");
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: null,
    activeProfileProxy: null,
    isAuthenticated: false,
    setToast: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: null,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
  const container = document.createElement("div");
  container.innerHTML = renderToString(accountUi());
  document.body.appendChild(container);
  const initialAccount = within(container).getByRole("status", {
    name: "Loading account",
  });
  const recoverableErrors: unknown[] = [];

  setAccount("0xalice");
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: alice,
    activeProfileProxy: null,
    isAuthenticated: true,
    setToast: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: alice,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);

  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, accountUi(), {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(initialAccount).not.toBeInTheDocument();
    expect(
      within(container).getByRole("button", {
        name: "Open account and profiles menu",
      })
    ).toBeInTheDocument();
    expect(recoverableErrors).toEqual([]);
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});

it("preserves fresh-wallet selection on the expanded connect control", () => {
  setAccount(undefined, "disconnected");
  render(accountUi(false));
  fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
  expect(freshConnect).toHaveBeenCalledTimes(1);
});

it("offers retry instead of an endless skeleton when profile loading fails", () => {
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: null,
    isLoading: false,
    isError: true,
    isFetching: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
  const { rerender } = render(accountUi());
  fireEvent.click(
    screen.getByRole("button", { name: "Profile unavailable. Retry" })
  );
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Profile unavailable. Retry"
  );
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: null,
    isLoading: false,
    isError: false,
    isFetching: true,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
  rerender(accountUi(false));
  expect(
    screen.getByRole("status", { name: "Loading account" })
  ).toBeInTheDocument();
});

it("offers profile setup for an empty successful identity result", () => {
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: null,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
  render(accountUi());
  expect(screen.getByRole("link", { name: "Create profile" })).toHaveAttribute(
    "href",
    "/0xalice"
  );
  expect(
    screen.queryByRole("button", { name: "Profile unavailable. Retry" })
  ).not.toBeInTheDocument();
});

it("exposes the selected account to assistive technology while collapsed", () => {
  render(accountUi());
  expect(
    screen.getByRole("button", { name: "Open account and profiles menu" })
  ).toHaveAccessibleDescription("alice");
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
  jest.mocked(useSidebarIdentity).mockReturnValue({
    profile: bob,
    isLoading: false,
    refetch,
  } as unknown as ReturnType<typeof useSidebarIdentity>);
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
