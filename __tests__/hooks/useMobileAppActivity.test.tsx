import { createElement } from "react";
import { act, renderHook } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { App, type StateChangeListener } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import {
  useMobileAppActivity,
  useMobileBatterySavings,
} from "@/hooks/useMobileAppActivity";
import { subscribeToTouchFirstChanges } from "@/helpers/touch-first.helpers";
import { useVideoLoading } from "@/components/drops/view/item/content/media/useVideoLoading";

let mockMobileBrowser = true;
let mockCapabilitiesChanged: () => void;
const mockRemoveCapabilities = jest.fn();
jest.mock("@/helpers/touch-first.helpers", () => ({
  isTouchFirstEnvironment: () => mockMobileBrowser,
  subscribeToTouchFirstChanges: jest.fn((notify: () => void) => {
    mockCapabilitiesChanged = notify;
    return mockRemoveCapabilities;
  }),
}));
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: { isNativePlatform: jest.fn(() => false) },
}));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn(), getState: jest.fn() },
}));

function setVisibility(value: DocumentVisibilityState) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMobileBrowser = true;
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  setVisibility("visible");
});

it("shares browser visibility/capability listeners and never calls native plugins", () => {
  const listener = jest.spyOn(document, "addEventListener");
  const first = renderHook(useMobileAppActivity);
  const second = renderHook(useMobileBatterySavings);
  expect(first.result.current).toBe(true);
  expect(second.result.current).toBe(true);
  expect(subscribeToTouchFirstChanges).toHaveBeenCalledTimes(1);
  expect(
    listener.mock.calls.filter(([type]) => type === "visibilitychange")
  ).toHaveLength(1);
  setVisibility("hidden");
  expect(first.result.current).toBe(false);
  first.unmount();
  expect(mockRemoveCapabilities).not.toHaveBeenCalled();
  second.unmount();
  expect(mockRemoveCapabilities).toHaveBeenCalledTimes(1);
  expect(App.addListener).not.toHaveBeenCalled();
  expect(App.getState).not.toHaveBeenCalled();
  listener.mockRestore();
});

it("retains desktop activity and responds to device capability changes", () => {
  mockMobileBrowser = false;
  setVisibility("hidden");
  const { result } = renderHook(() => ({
    active: useMobileAppActivity(),
    mobile: useMobileBatterySavings(),
  }));
  expect(result.current).toEqual({ active: true, mobile: false });
  act(() => {
    mockMobileBrowser = true;
    mockCapabilitiesChanged();
  });
  expect(result.current).toEqual({ active: false, mobile: true });
  setVisibility("visible");
  expect(result.current.active).toBe(true);
});

it("still observes native app pauses when the document remains visible", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  mockMobileBrowser = false;
  let sendState: ((state: { isActive: boolean }) => void) | undefined;
  const remove = jest.fn().mockResolvedValue(undefined);
  jest.mocked(App.getState).mockResolvedValue({ isActive: true });
  // Narrow the overloaded plugin method to the appStateChange event being tested.
  const addActivityListener = jest.mocked(
    App.addListener as (
      event: "appStateChange",
      listener: StateChangeListener
    ) => Promise<PluginListenerHandle>
  );
  addActivityListener.mockImplementation((_event, listener) => {
    sendState = listener;
    return Promise.resolve({ remove });
  });
  const first = renderHook(useMobileAppActivity);
  const second = renderHook(useMobileBatterySavings);
  await act(async () => {
    await Promise.resolve();
  });
  act(() => sendState?.({ isActive: false }));
  expect(document.visibilityState).toBe("visible");
  expect(first.result.current).toBe(false);
  expect(second.result.current).toBe(true);
  expect(App.addListener).toHaveBeenCalledTimes(1);
  first.unmount();
  second.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it("hydrates before applying hidden mobile-browser activity", async () => {
  function Activity() {
    return createElement("span", null, String(useMobileAppActivity()));
  }
  const container = document.createElement("div");
  container.innerHTML = renderToString(createElement(Activity));
  expect(container.textContent).toBe("true");
  setVisibility("hidden");
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(Activity), {
        onRecoverableError,
      });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("false");
    setVisibility("visible");
    expect(container.textContent).toBe("true");
  } finally {
    act(() => root?.unmount());
  }
});

it("hydrates a DOM-facing mobile policy consumer before applying hidden-tab loading", async () => {
  function Video() {
    const mobile = useMobileBatterySavings();
    const active = useMobileAppActivity();
    const { renderedSrc, videoPreload } = useVideoLoading({
      directSrc: "clip.mp4",
      videoElement: null,
      isMobileEnvironment: mobile,
      isAppActive: active,
      isInView: false,
      isAnyFullscreen: false,
      openedSource: undefined,
      poster: undefined,
      isPosterGateClosed: false,
      autoPlay: false,
      preload: "metadata",
    });
    return createElement("video", {
      src: renderedSrc,
      preload: videoPreload,
      "data-mobile": String(mobile),
    });
  }
  const container = document.createElement("div");
  container.innerHTML = renderToString(createElement(Video));
  const video = container.querySelector("video")!;
  expect(video).toHaveAttribute("data-mobile", "false");
  expect(video).not.toHaveAttribute("src");
  setVisibility("hidden");
  const onRecoverableError = jest.fn();
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(Video), {
        onRecoverableError,
      });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(video).toHaveAttribute("data-mobile", "true");
    expect(video).not.toHaveAttribute("src");
    expect(video.preload).toBe("none");
  } finally {
    act(() => root?.unmount());
    consoleError.mockRestore();
  }
});
