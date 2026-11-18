import { act, renderHook } from "@testing-library/react";
import { useNavigateToDropWave } from "@/hooks/useNavigateToDropWave";
import { useExitActiveWave } from "@/components/navigation/useExitActiveWave";
import { PROFILE_WAVES_FEED_HREF } from "@/helpers/waves/profile-feed-navigation";

const mockPush = jest.fn();
const mockSetActiveWave = jest.fn();
const mockClearLastVisited = jest.fn();
let mockIsApp = true;
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({ activeWave: { set: mockSetActiveWave } }),
}));
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({ clearLastVisited: mockClearLastVisited }),
}));
jest.mock("@/helpers/waves/wave-navigation-transition", () => ({
  runWaveNavigationTransition: (_screen: string, navigate: () => void) =>
    navigate(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsApp = true;
  window.history.replaceState(null, "", PROFILE_WAVES_FEED_HREF);
});
afterEach(() => window.history.replaceState(null, "", "/"));

it("marks native feed post navigation while retaining the post and edit destination", () => {
  const { result } = renderHook(useNavigateToDropWave);
  act(() =>
    result.current(
      { id: "post", serial_no: 7, wave: { id: "wave-a" } },
      { edit: true }
    )
  );
  const destination = new URL(
    mockPush.mock.calls[0][0],
    window.location.origin
  );
  expect(destination.pathname).toBe("/waves/wave-a");
  expect(destination.searchParams.get("serialNo")).toBe("7");
  expect(destination.searchParams.get("editPost")).toBe("post");
  expect(destination.searchParams.get("returnTo")).toBe(
    PROFILE_WAVES_FEED_HREF
  );
});

it.each(["web", "ordinary-wave", "dm"])(
  "keeps %s navigation unchanged",
  (mode) => {
    mockIsApp = mode !== "web";
    if (mode === "ordinary-wave")
      window.history.replaceState(null, "", "/waves/wave-a");
    const { result } = renderHook(useNavigateToDropWave);
    act(() =>
      result.current({
        serial_no: 7,
        wave: {
          id: "wave-b",
          chat: { scope: { group: { is_direct_message: mode === "dm" } } },
        },
      })
    );
    const destination = new URL(
      mockPush.mock.calls[0][0],
      window.location.origin
    );
    expect(destination.searchParams.has("returnTo")).toBe(false);
    expect(destination.pathname).toBe(
      mode === "dm" ? "/messages/wave-b" : "/waves/wave-b"
    );
  }
);

it("returns a native feed-origin chat to the feed without resetting scroll", () => {
  window.history.replaceState(
    null,
    "",
    "/waves/wave-a?returnTo=" + encodeURIComponent(PROFILE_WAVES_FEED_HREF)
  );
  const { result } = renderHook(useExitActiveWave);
  act(() => result.current(false));
  expect(mockSetActiveWave).toHaveBeenCalledWith(null, { profileFeed: true });
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockClearLastVisited).toHaveBeenCalledWith("wave");
});

it.each([
  undefined,
  "https://example.com",
  "javascript:alert(1)",
  "/waves?view=profile-feed&other=1",
])("does not accept an unrelated return destination: %s", (target) => {
  const search = new URLSearchParams();
  if (target) search.set("returnTo", target);
  window.history.replaceState(null, "", "/waves/wave-a?" + search);
  const { result } = renderHook(useExitActiveWave);
  act(() => result.current(false));
  expect(mockSetActiveWave).toHaveBeenCalledWith(null, {
    isDirectMessage: false,
  });
  expect(mockPush).not.toHaveBeenCalled();
});

it.each(["web", "dm"])(
  "preserves the existing %s Back destination even with a feed marker",
  (mode) => {
    mockIsApp = mode !== "web";
    window.history.replaceState(
      null,
      "",
      "/waves/wave-a?returnTo=" + encodeURIComponent(PROFILE_WAVES_FEED_HREF)
    );
    const { result } = renderHook(useExitActiveWave);
    act(() => result.current(mode === "dm"));
    expect(mockSetActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: mode === "dm",
    });
    expect(mockPush).not.toHaveBeenCalled();
  }
);
