import { act, render, waitFor } from "@testing-library/react";
import CapacitorSetup from "@/components/providers/CapacitorSetup";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { Capacitor } from "@capacitor/core";
import {
  Keyboard,
  KeyboardResize,
  type KeyboardInfo,
} from "@capacitor/keyboard";

jest.mock("@/hooks/useCapacitor");
jest.mock("@/hooks/useDeviceInfo");
jest.mock("@capacitor/keyboard", () => ({
  Keyboard: { setResizeMode: jest.fn(), addListener: jest.fn() },
  KeyboardResize: { None: "none" },
}));

const WEB_VIEWPORT =
  "width=device-width,initial-scale=1,maximum-scale=10,user-scalable=yes,viewport-fit=cover";
const NATIVE_VIEWPORT =
  "width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";

function setDevice(isCapacitor: boolean, isAppleMobile: boolean) {
  jest.mocked(useCapacitor).mockReturnValue({
    isCapacitor,
    isIos: isCapacitor && isAppleMobile,
    isAndroid: isCapacitor && !isAppleMobile,
    platform: "web",
    orientation: 0,
    isActive: true,
  });
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: isCapacitor,
    isAppleMobile,
    isMobileDevice: isAppleMobile,
    hasTouchScreen: isAppleMobile,
  });
}

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value,
  });
}

describe("viewport focus zoom policy", () => {
  const originalUserAgent = navigator.userAgent;
  let meta: HTMLMetaElement;

  beforeEach(() => {
    jest.spyOn(Capacitor, "isPluginAvailable").mockReturnValue(false);
    setDevice(false, false);
    setUserAgent(originalUserAgent);
    meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = WEB_VIEWPORT;
    document.head.appendChild(meta);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document
      .querySelectorAll('meta[name="viewport"]')
      .forEach((node) => node.remove());
    document.body.classList.remove("capacitor-native");
    setUserAgent(originalUserAgent);
    Reflect.deleteProperty(navigator, "standalone");
  });

  it.each([true, false])(
    "keeps native scale locked after metadata replacement (iOS=%s)",
    async (isIos) => {
      setDevice(true, isIos);
      const { unmount } = render(<CapacitorSetup />);
      expect(meta.content).toBe(NATIVE_VIEWPORT);

      meta.content = WEB_VIEWPORT;
      await waitFor(() => expect(meta.content).toBe(NATIVE_VIEWPORT));

      const replacement = document.createElement("meta");
      replacement.name = "viewport";
      replacement.content = `${WEB_VIEWPORT},interactive-widget=resizes-visual`;
      meta.replaceWith(replacement);
      await waitFor(() => expect(replacement.content).toBe(NATIVE_VIEWPORT));

      unmount();
      expect(replacement.content).toBe(
        `${WEB_VIEWPORT},interactive-widget=resizes-visual`
      );
    }
  );

  it.each([IPHONE_SAFARI, IPAD_SAFARI])(
    "limits Safari focus zoom while retaining web viewport options (%s)",
    async (userAgent) => {
      setDevice(false, true);
      setUserAgent(userAgent);
      const { unmount } = render(<CapacitorSetup />);
      expect(meta.content).toBe(
        WEB_VIEWPORT.replace("maximum-scale=10", "maximum-scale=1")
      );
      expect(meta.content).toContain("user-scalable=yes");
      expect(meta.content).not.toContain("minimum-scale=1");
      expect(document.body).not.toHaveClass("capacitor-native");

      meta.content = `${WEB_VIEWPORT},interactive-widget=resizes-visual`;
      await waitFor(() => expect(meta.content).toContain("maximum-scale=1,"));
      unmount();
      expect(meta.content).toBe(
        `${WEB_VIEWPORT},interactive-widget=resizes-visual`
      );
    }
  );

  it("handles home-screen Safari without a Safari user-agent token", () => {
    setDevice(false, true);
    setUserAgent("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148");
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });
    render(<CapacitorSetup />);
    expect(meta.content).toContain("maximum-scale=1,");
    expect(meta.content).toContain("user-scalable=yes");
  });

  it.each([
    [
      "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      false,
    ],
    [
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/140 Mobile Safari/604.1",
      true,
    ],
    [IPAD_SAFARI, false],
  ])(
    "leaves other web browsers untouched (%s)",
    async (userAgent, isAppleMobile) => {
      setDevice(false, isAppleMobile);
      setUserAgent(userAgent);
      render(<CapacitorSetup />);
      expect(meta.content).toBe(WEB_VIEWPORT);
      meta.content =
        "width=device-width,initial-scale=2,maximum-scale=10,user-scalable=yes";
      await Promise.resolve();
      expect(meta.content).toBe(
        "width=device-width,initial-scale=2,maximum-scale=10,user-scalable=yes"
      );
    }
  );

  it("appends the Safari limit when maximum-scale is absent and restores missing content", () => {
    setDevice(false, true);
    setUserAgent(IPHONE_SAFARI);
    meta.removeAttribute("content");
    const { unmount } = render(<CapacitorSetup />);
    expect(meta.content).toBe(
      "width=device-width,initial-scale=1,maximum-scale=1"
    );
    unmount();
    expect(meta).not.toHaveAttribute("content");
  });

  it("stops enforcing the policy and restores the web viewport when native identity changes", async () => {
    setDevice(true, false);
    const { rerender } = render(<CapacitorSetup />);
    expect(meta.content).toBe(NATIVE_VIEWPORT);
    setDevice(false, false);
    rerender(<CapacitorSetup />);
    expect(meta.content).toBe(WEB_VIEWPORT);
    meta.content = "width=device-width,initial-scale=2";
    await Promise.resolve();
    expect(meta.content).toBe("width=device-width,initial-scale=2");
  });
});

describe("native keyboard integration", () => {
  const listeners = new Map<string, (height?: number) => void>();
  const remove = jest.fn();
  const originalHeight = window.innerHeight;

  beforeEach(() => {
    listeners.clear();
    remove.mockClear();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 932,
    });
    jest.spyOn(Capacitor, "isPluginAvailable").mockReturnValue(true);
    jest.mocked(Keyboard.setResizeMode).mockResolvedValue();
    jest.mocked(Keyboard.setResizeMode).mockClear();
    jest.mocked(Keyboard.addListener).mockClear();
    jest
      .mocked(Keyboard.addListener)
      .mockImplementation(
        async (
          event,
          callback: ((info: KeyboardInfo) => void) | (() => void)
        ) => {
          listeners.set(event, (height = 386) =>
            callback({ keyboardHeight: height })
          );
          return { remove };
        }
      );
    setDevice(true, true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalHeight,
    });
    document.body.classList.remove("capacitor-native");
  });

  function renderFrame(singleView: boolean, height: number) {
    const view = render(
      <>
        <CapacitorSetup />
        <div
          data-video-viewport={singleView || undefined}
          style={{ overflowY: "auto", paddingBottom: "16px" }}
        >
          <iframe
            title="Interactive artwork"
            style={{
              width: "398px",
              height: height + "px",
              scrollMarginBottom: "12px",
            }}
          />
        </div>
      </>
    );
    const frame = document.querySelector("iframe")!;
    jest
      .spyOn(frame, "getBoundingClientRect")
      .mockReturnValue({ height } as DOMRect);
    frame.scrollIntoView = jest.fn();
    frame.focus();
    return { ...view, frame, host: frame.parentElement! };
  }

  it("aligns a large single-view frame without adding padding or changing artwork dimensions", async () => {
    const { frame, host, unmount } = renderFrame(true, 640);
    act(() => listeners.get("keyboardDidShow")?.());
    expect(frame.scrollIntoView).toHaveBeenCalledWith({
      block: "end",
      behavior: "instant",
    });
    expect(frame.style.scrollMarginBottom).toBe("386px");
    expect(host.style.paddingBottom).toBe("16px");
    expect(document.body.style.paddingBottom).toBe("");
    expect(frame.style.width).toBe("398px");
    expect(frame.style.height).toBe("640px");
    expect(Keyboard.setResizeMode).toHaveBeenCalledWith({
      mode: KeyboardResize.None,
    });
    act(() => listeners.get("keyboardDidHide")?.());
    expect(frame.style.scrollMarginBottom).toBe("12px");
    act(() => listeners.get("keyboardDidShow")?.());
    unmount();
    expect(frame.style.scrollMarginBottom).toBe("12px");
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
  });

  it.each([
    ["chat frame", false, 640, 386],
    ["single-view frame that fits above the keyboard", true, 224, 386],
    ["zero-height keyboard", true, 640, 0],
  ] as const)(
    "leaves %s to the existing keyboard handling",
    (_, singleView, height, keyboardHeight) => {
      const { frame, host } = renderFrame(singleView, height);
      act(() => listeners.get("keyboardDidShow")?.(keyboardHeight));
      expect(frame.scrollIntoView).not.toHaveBeenCalled();
      expect(frame.style.scrollMarginBottom).toBe("12px");
      expect(host.style.paddingBottom).toBe("16px");
    }
  );

  it("leaves app-owned text fields to the existing keyboard handling", () => {
    render(
      <>
        <CapacitorSetup />
        <textarea aria-label="Composer" />
      </>
    );
    document.querySelector("textarea")!.focus();
    act(() => listeners.get("keyboardDidShow")?.());
    expect(document.body.style.paddingBottom).toBe("");
    expect(Keyboard.setResizeMode).toHaveBeenCalledWith({
      mode: KeyboardResize.None,
    });
  });

  it.each(["web", "Android", "unavailable iOS plugin"])(
    "does not configure keyboard resize for %s",
    (platform) => {
      if (platform === "web") setDevice(false, true);
      if (platform === "Android") setDevice(true, false);
      if (platform === "unavailable iOS plugin")
        jest.mocked(Capacitor.isPluginAvailable).mockReturnValue(false);
      render(<CapacitorSetup />);
      expect(Keyboard.setResizeMode).not.toHaveBeenCalled();
      expect(Keyboard.addListener).not.toHaveBeenCalled();
    }
  );
});
