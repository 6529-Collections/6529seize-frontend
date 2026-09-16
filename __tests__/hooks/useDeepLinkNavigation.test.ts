import { renderHook, act } from "@testing-library/react";
import { useDeepLinkNavigation } from "@/hooks/useDeepLinkNavigation";
import { App, type URLOpenListener } from "@capacitor/app";

type AppUrlOpenSubscription = (
  event: "appUrlOpen",
  listener: URLOpenListener
) => ReturnType<typeof App.addListener>;

const push = jest.fn();
const router = { push };
jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn(), getLaunchUrl: jest.fn() },
}));
const capacitorMock = jest.fn(() => ({ isCapacitor: true }));
jest.mock("@/hooks/useCapacitor", () => () => capacitorMock());
const remove = jest.fn();
let callback: (data: { url: string }) => void;

beforeEach(() => {
  jest.clearAllMocks();
  capacitorMock.mockReturnValue({ isCapacitor: true });
  jest
    .mocked<AppUrlOpenSubscription>(App.addListener)
    .mockImplementation((_event, cb) => {
      callback = cb;
      return Promise.resolve({ remove });
    });
  jest.mocked(App.getLaunchUrl).mockResolvedValue(undefined);
});

test("navigates on a warm link with repeated query values and fragment, then cleans up", async () => {
  const { unmount } = renderHook(() => useDeepLinkNavigation());
  await act(async () => {
    callback({ url: "mobile6529://navigate/waves/1?tag=a&tag=b#drop-2" });
  });
  expect(push).toHaveBeenCalledWith(
    expect.stringMatching(/^\/waves\/1\?tag=a&tag=b&_t=\d+#drop-2$/)
  );
  unmount();
  await Promise.resolve();
  expect(remove).toHaveBeenCalled();
});

test("handles cold start and deduplicates the initial event", async () => {
  const url = "mobile6529://navigate/prxt0/collected?view=grid";
  jest.mocked(App.getLaunchUrl).mockResolvedValue({ url });
  renderHook(() => useDeepLinkNavigation());
  await act(async () => {});
  expect(push).toHaveBeenCalledWith(
    expect.stringContaining("/prxt0/collected?view=grid")
  );
  act(() => callback({ url }));
  expect(push).toHaveBeenCalledTimes(1);
});

test("a newer foreground link wins over a late launch URL", async () => {
  let resolveLaunch: (value: { url: string }) => void = () => undefined;
  jest.mocked(App.getLaunchUrl).mockReturnValue(
    new Promise((resolve) => {
      resolveLaunch = resolve;
    })
  );
  renderHook(() => useDeepLinkNavigation());
  act(() => callback({ url: "mobile6529://navigate/waves/new" }));
  await act(async () =>
    resolveLaunch({ url: "mobile6529://navigate/waves/old" })
  );
  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith(expect.stringContaining("/waves/new?"));
});

test("does not navigate after unmount", async () => {
  let resolveLaunch: (value: { url: string }) => void = () => undefined;
  jest.mocked(App.getLaunchUrl).mockReturnValue(
    new Promise((resolve) => {
      resolveLaunch = resolve;
    })
  );
  const { unmount } = renderHook(() => useDeepLinkNavigation());
  unmount();
  await act(async () =>
    resolveLaunch({ url: "mobile6529://navigate/waves/old" })
  );
  expect(push).not.toHaveBeenCalled();
});

test("foreground links still work if launch retrieval rejects", async () => {
  jest.mocked(App.getLaunchUrl).mockRejectedValue(new Error("unavailable"));
  renderHook(() => useDeepLinkNavigation());
  await act(async () => {});
  act(() => callback({ url: "mobile6529://navigate/waves/1" }));
  expect(push).toHaveBeenCalledTimes(1);
});

test("registers when the runtime becomes native and cleans up on transition to web", async () => {
  capacitorMock.mockReturnValue({ isCapacitor: false });
  const { rerender } = renderHook(() => useDeepLinkNavigation());
  expect(App.addListener).not.toHaveBeenCalled();
  capacitorMock.mockReturnValue({ isCapacitor: true });
  rerender();
  await act(async () => {});
  expect(App.addListener).toHaveBeenCalledTimes(1);
  capacitorMock.mockReturnValue({ isCapacitor: false });
  rerender();
  await act(async () => {});
  expect(remove).toHaveBeenCalledTimes(1);
});
