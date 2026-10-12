import { act, renderHook, waitFor } from "@testing-library/react";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { commonApiFetch } from "@/services/api/common-api";
import type { ConnectedWalletAccount } from "@/services/auth/auth.utils";
import type { ReactNode } from "react";

let mockMobileBrowser = true;
jest.mock("@/helpers/touch-first.helpers", () => ({
  isTouchFirstEnvironment: () => mockMobileBrowser,
  subscribeToTouchFirstChanges: () => () => undefined,
}));
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: { isNativePlatform: () => false },
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => "test-jwt",
  isAuthJwtUsable: () => true,
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const account: ConnectedWalletAccount = {
  address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  refreshToken: "test-refresh",
  role: null,
  jwt: "test-jwt",
  profileId: null,
  profileHandle: "alice",
};
const cases = [
  {
    name: "active identity",
    useNotifications: () => useUnreadNotifications("alice"),
  },
  {
    name: "connected accounts",
    useNotifications: () => useConnectedAccountsUnreadNotifications([account]),
  },
];

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(commonApiFetch).mockClear();
  jest.mocked(commonApiFetch).mockResolvedValue({ unread_count: 3 });
  setVisibility("visible");
  focusManager.setFocused(undefined);
});
afterEach(() => {
  setVisibility("visible");
  focusManager.setFocused(undefined);
  jest.useRealTimers();
});

describe.each(cases)(
  "$name notification polling",
  ({ name, useNotifications }) => {
    it.each([true, false])(
      "respects hidden mobile tabs while preserving desktop polling (mobile=%s)",
      async (mobile) => {
        mockMobileBrowser = mobile;
        const client = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });
        const wrapper = ({ children }: { readonly children: ReactNode }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
        const { result, unmount } = renderHook(() => useNotifications(), {
          wrapper,
        });
        try {
          await waitFor(() =>
            expect(result.current).toEqual(
              name === "active identity"
                ? {
                    notifications: { unread_count: 3 },
                    haveUnreadNotifications: true,
                  }
                : { "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": 3 }
            )
          );
          expect(commonApiFetch).toHaveBeenCalledTimes(1);
          const cachedResult = result.current;
          act(() => setVisibility("hidden"));
          const beforeHidden = jest.mocked(commonApiFetch).mock.calls.length;
          await act(async () => {
            jest.advanceTimersByTime(90_000);
          });
          if (mobile) {
            expect(commonApiFetch).toHaveBeenCalledTimes(beforeHidden);
            expect(result.current).toEqual(cachedResult);
          } else {
            expect(
              jest.mocked(commonApiFetch).mock.calls.length
            ).toBeGreaterThan(beforeHidden);
          }
          const beforeReturn = jest.mocked(commonApiFetch).mock.calls.length;
          await act(async () => {
            setVisibility("visible");
          });
          await waitFor(() =>
            expect(
              jest.mocked(commonApiFetch).mock.calls.length
            ).toBeGreaterThan(beforeReturn)
          );
        } finally {
          unmount();
          client.clear();
        }
      }
    );
  }
);
