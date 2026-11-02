import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import NotificationsInbox from "@/components/notifications/inbox/NotificationsInbox";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";

const mockMutate = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: mockMutate, isPending: false }),
}));
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
    connectedProfile: handle ? { handle } : null,
    activeProfileProxy: proxy ? { id: "proxy" } : null,
    setToast: jest.fn(),
  } as ReturnType<typeof useAuth>);
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
      <NotificationsInbox onClose={jest.fn()} />
    </StrictMode>
  );
}

describe("NotificationsInbox automatic read", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setProfile("alice");
    setQuerySuccess(true);
    jest.mocked(useSeizeConnectContext).mockReturnValue({
      hasValidWalletAuth: true,
    } as ReturnType<typeof useSeizeConnectContext>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks all read once per opening, including under StrictMode", () => {
    const view = render(inbox());
    act(() => jest.runOnlyPendingTimers());
    view.rerender(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith("all");

    view.unmount();
    render(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  it("waits for a successful inbox load", () => {
    setQuerySuccess(false);
    const view = render(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).not.toHaveBeenCalled();

    setQuerySuccess(true);
    view.rerender(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).toHaveBeenCalledWith("all");
  });

  it.each(["unauthenticated", "no profile", "proxy"])(
    "does not mark read with %s access",
    (access) => {
      if (access === "unauthenticated") {
        jest.mocked(useSeizeConnectContext).mockReturnValue({
          hasValidWalletAuth: false,
        } as ReturnType<typeof useSeizeConnectContext>);
      }
      if (access === "no profile") setProfile(null);
      if (access === "proxy") setProfile("alice", true);

      render(inbox());
      act(() => jest.runOnlyPendingTimers());
      expect(mockMutate).not.toHaveBeenCalled();
    }
  );

  it("cancels a pending read when closed before the effect runs", () => {
    const view = render(inbox());
    view.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("only marks the current profile when the account changes before the request", () => {
    const view = render(inbox());
    setProfile("bob");
    view.rerender(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).toHaveBeenCalledTimes(1);

    setProfile("alice");
    view.rerender(inbox());
    act(() => jest.runOnlyPendingTimers());
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });
});
