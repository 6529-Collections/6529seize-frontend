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
  window.history.replaceState(null, "", "/");
});

afterAll(() => {
  window.history.replaceState(null, "", "/");
});

const pendingLaunchUrl = () => {
  let resolveLaunch: (value: { url: string } | undefined) => void = () =>
    undefined;
  jest.mocked(App.getLaunchUrl).mockReturnValue(
    new Promise((resolve) => {
      resolveLaunch = resolve;
    })
  );
  return (value?: { url: string }) => resolveLaunch(value);
};

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
  const resolveLaunch = pendingLaunchUrl();
  renderHook(() => useDeepLinkNavigation());
  act(() => callback({ url: "mobile6529://navigate/waves/new" }));
  await act(async () =>
    resolveLaunch({ url: "mobile6529://navigate/waves/old" })
  );
  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith(expect.stringContaining("/waves/new?"));
});

test("does not navigate after unmount", async () => {
  const resolveLaunch = pendingLaunchUrl();
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

describe("when the shell opened the app at the launch link's page", () => {
  const launchLink =
    "mobile6529://navigate/waves/1?tag=a&tag=b&view=grid#drop-2";

  test("does not navigate again for the launch URL or its replayed event", async () => {
    window.history.replaceState(
      null,
      "",
      "/waves/1?view=grid&tag=a&tag=b#drop-2"
    );
    jest.mocked(App.getLaunchUrl).mockResolvedValue({ url: launchLink });
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    act(() => callback({ url: launchLink }));
    expect(push).not.toHaveBeenCalled();
  });

  test("does not navigate again when iOS replays the launch link first", async () => {
    window.history.replaceState(
      null,
      "",
      "/waves/1?tag=a&tag=b&view=grid#drop-2"
    );
    const resolveLaunch = pendingLaunchUrl();
    renderHook(() => useDeepLinkNavigation());
    act(() => callback({ url: launchLink }));
    await act(async () => resolveLaunch({ url: launchLink }));
    expect(push).not.toHaveBeenCalled();
  });

  test("does not navigate again for a universal launch link", async () => {
    window.history.replaceState(null, "", "/the-memes/1");
    jest
      .mocked(App.getLaunchUrl)
      .mockResolvedValue({ url: "https://6529.io/the-memes/1" });
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    expect(push).not.toHaveBeenCalled();
  });

  test.each([
    ["another page", "/waves/2?tag=a&tag=b&view=grid#drop-2"],
    ["different query values", "/waves/1?tag=b&tag=a&view=grid#drop-2"],
    ["another fragment", "/waves/1?tag=a&tag=b&view=grid"],
  ])("still navigates from %s", async (_label, current) => {
    window.history.replaceState(null, "", current);
    jest.mocked(App.getLaunchUrl).mockResolvedValue({ url: launchLink });
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/waves\/1\?tag=a&tag=b&view=grid&_t=\d+#drop-2$/)
    );
  });

  test("keeps navigating for a later link to the page already showing", async () => {
    window.history.replaceState(null, "", "/waves/1");
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    act(() => callback({ url: "mobile6529://navigate/waves/1" }));
    expect(push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/waves\/1\?_t=\d+$/)
    );
  });
});

describe("universal links", () => {
  test.each([
    [
      "https://6529.io/waves/1?drop=2#drop-2",
      /^\/waves\/1\?drop=2&_t=\d+#drop-2$/,
    ],
    ["https://www.6529.io/the-memes/1", /^\/the-memes\/1\?_t=\d+$/],
    ["https://6529.io", /^\/\?_t=\d+$/],
  ])("navigates in the app for %s", async (url, expected) => {
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    act(() => callback({ url }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(expected));
  });

  test("navigates for a universal launch link from another page", async () => {
    jest
      .mocked(App.getLaunchUrl)
      .mockResolvedValue({ url: "https://6529.io/the-memes/1" });
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    expect(push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/the-memes\/1\?_t=\d+$/)
    );
  });

  test.each([
    "https://evil.example/waves/1",
    "https://6529.io.evil.example/waves/1",
    "http://6529.io/waves/1",
    "https://6529.io/api/version",
    "https://6529.io/auth/callback",
    "https://6529.io/favicon.ico",
  ])("ignores %s", async (url) => {
    renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    act(() => callback({ url }));
    expect(push).not.toHaveBeenCalled();
  });
});
