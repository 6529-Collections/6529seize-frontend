import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import NotificationsInbox from "@/components/notifications/inbox/NotificationsInbox";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

const postRead = jest.mocked(commonApiPostWithoutBodyAndResponse);
let queryClient: QueryClient;
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useNotificationsQuery", () => ({
  useNotificationsQuery: jest.fn(),
}));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({ hideNftPurchasing: false }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en",
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  ReactQueryWrapperContext: jest
    .requireActual<typeof import("react")>("react")
    .createContext({ invalidateNotifications: jest.fn() }),
}));
jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    reconcileProfileDeliveredNotifications: jest.fn(),
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn(),
}));

function setProfile(handle: string | null, proxy = false) {
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: handle ? ({ handle } as ApiIdentity) : null,
    activeProfileProxy: proxy ? ({ id: "proxy" } as ApiProfileProxy) : null,
    fetchingProfile: false,
    connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
    receivedProfileProxies: [],
    showWaves: true,
    sessionUpgradeRequired: false,
    requestAuth: jest.fn(async () => ({ success: true })),
    setActiveProfileProxy: jest.fn(async () => false),
    setToast: jest.fn(),
  });
}

function setQuerySuccess(isSuccess: boolean) {
  jest.mocked(useNotificationsQuery).mockReturnValue({
    rawItems: [],
    isSuccess,
    isPending: !isSuccess,
  } as unknown as ReturnType<typeof useNotificationsQuery>);
}

function inbox() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <NotificationsInbox onClose={jest.fn()} />
      </QueryClientProvider>
    </StrictMode>
  );
}

describe("NotificationsInbox automatic read", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    postRead.mockResolvedValue(undefined);
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    setProfile("alice");
    setQuerySuccess(true);
    jest.mocked(useSeizeConnectContext).mockReturnValue({
      hasValidWalletAuth: true,
    } as ReturnType<typeof useSeizeConnectContext>);
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it("marks all read once per opening, including under StrictMode", async () => {
    const view = render(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    view.rerender(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(1);
    expect(postRead).toHaveBeenCalledWith({ endpoint: "notifications/read" });

    view.unmount();
    render(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(2);
  });

  it("waits for a successful inbox load", async () => {
    setQuerySuccess(false);
    const view = render(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).not.toHaveBeenCalled();

    setQuerySuccess(true);
    view.rerender(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledWith({ endpoint: "notifications/read" });
  });

  it.each(["unauthenticated", "no profile", "proxy"])(
    "does not mark read with %s access",
    async (access) => {
      if (access === "unauthenticated") {
        jest.mocked(useSeizeConnectContext).mockReturnValue({
          hasValidWalletAuth: false,
        } as ReturnType<typeof useSeizeConnectContext>);
      }
      if (access === "no profile") setProfile(null);
      if (access === "proxy") setProfile("alice", true);

      render(inbox());
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });
      expect(postRead).not.toHaveBeenCalled();
    }
  );

  it("cancels a pending read when closed before the effect runs", async () => {
    const view = render(inbox());
    view.unmount();
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).not.toHaveBeenCalled();
  });

  it("only marks the current profile when the account changes before the request", async () => {
    const view = render(inbox());
    setProfile("bob");
    view.rerender(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(1);

    setProfile("alice");
    view.rerender(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(2);
  });

  it("retries a failed automatic read when the popover is reopened", async () => {
    postRead.mockRejectedValueOnce(new Error("Temporary read failure"));
    const view = render(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(postRead).toHaveBeenCalledTimes(1);

    view.rerender(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(1);

    // DesktopNotifications conditionally mounts Inbox only while open.
    view.unmount();
    render(inbox());
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(postRead).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
