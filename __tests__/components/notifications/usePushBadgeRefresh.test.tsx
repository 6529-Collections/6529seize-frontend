import { act, renderHook, waitFor } from "@testing-library/react";
import { usePushBadgeRefresh } from "@/components/notifications/usePushBadgeRefresh";
import { requestPushBadgeRefresh } from "@/services/notifications/push-badge-refresh";
import * as Sentry from "@sentry/nextjs";

jest.mock("@/services/notifications/push-badge-refresh", () => ({
  requestPushBadgeRefresh: jest.fn(),
}));
jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));
const device = { deviceId: "phone", token: "token" };
const refresh = jest.mocked(requestPushBadgeRefresh);
beforeEach(() => {
  jest.clearAllMocks();
  refresh.mockReset().mockResolvedValue(undefined);
});
it("waits for successful registration, refreshes on launch and each resume, and ignores rerenders", async () => {
  const { result, rerender } = renderHook(
    ({ active }) => usePushBadgeRefresh(active, "auth-A"),
    { initialProps: { active: true } }
  );
  expect(refresh).not.toHaveBeenCalled();
  act(() => result.current(device, "auth-A"));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  rerender({ active: true });
  expect(refresh).toHaveBeenCalledTimes(1);
  rerender({ active: false });
  rerender({ active: true });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
});
it("defers a registration that finishes in the background until activation", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => usePushBadgeRefresh(enabled, "auth-A"),
    { initialProps: { enabled: false } }
  );
  act(() => result.current(device, "auth-A"));
  expect(refresh).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
});
it("invalidates old requests on auth changes and waits for the new registration", async () => {
  const { result, rerender, unmount } = renderHook(
    ({ auth }) => usePushBadgeRefresh(true, auth),
    { initialProps: { auth: "auth-A" } }
  );
  act(() => result.current(device, "auth-A"));
  const current = refresh.mock.calls[0]![1];
  expect(current()).toBe(true);
  rerender({ auth: "auth-B" });
  expect(current()).toBe(false);
  expect(refresh).toHaveBeenCalledTimes(1);
  act(() => result.current(device, "auth-A"));
  expect(refresh).toHaveBeenCalledTimes(1);
  act(() => result.current(device, "auth-B"));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  const latest = refresh.mock.calls[1]![1];
  unmount();
  expect(latest()).toBe(false);
});
it("contains failures, redacts credentials and retries on the next activation", async () => {
  refresh.mockRejectedValueOnce(new Error("secret request contents"));
  const { result, rerender } = renderHook(
    ({ enabled }) => usePushBadgeRefresh(enabled, "auth-A"),
    { initialProps: { enabled: true } }
  );
  act(() => result.current(device, "auth-A"));
  await waitFor(() =>
    expect(Sentry.captureException).toHaveBeenCalledWith(
      new Error("Push badge refresh request failed"),
      expect.any(Object)
    )
  );
  expect(refresh).toHaveBeenCalledTimes(1);
  rerender({ enabled: false });
  rerender({ enabled: true });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
});
