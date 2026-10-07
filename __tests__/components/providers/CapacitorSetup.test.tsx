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

describe("native iframe keyboard visibility", () => {
  const listeners = new Map<string, (height?: number) => void>();
  const remove = jest.fn();

  beforeEach(() => {
    listeners.clear();
    remove.mockClear();
    jest.spyOn(Capacitor, "isPluginAvailable").mockReturnValue(true);
    // The shared Jest setup stubs computed styles without geometry properties.
    jest
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) => (element as HTMLElement).style);
    jest.mocked(Keyboard.setResizeMode).mockResolvedValue();
    jest.mocked(Keyboard.setResizeMode).mockClear();
    jest
      .mocked(Keyboard.addListener)
      .mockImplementation(
        async (
          event,
          callback: ((info: KeyboardInfo) => void) | (() => void)
        ) => {
          listeners.set(event, (height = 300) =>
            callback({ keyboardHeight: height })
          );
          return { remove };
        }
      );
    setDevice(true, true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.classList.remove("capacitor-native");
  });

  it("scrolls the iframe above the keyboard without resizing artwork and releases listeners", async () => {
    const { unmount } = render(
      <>
        <CapacitorSetup />
        <div
          data-testid="scroll-host"
          style={{ overflowY: "auto", paddingBottom: "16px" }}
        >
          <iframe title="Interactive artwork" />
        </div>
      </>
    );
    const frame = document.querySelector("iframe")!;
    const scrollHost = frame.parentElement!;
    frame.scrollIntoView = jest.fn();
    frame.style.height = "460px";
    frame.style.width = "100%";
    frame.style.scrollMarginBottom = "12px";
    frame.focus();
    act(() => listeners.get("keyboardWillShow")?.());
    expect(frame.style.scrollMarginBottom).toBe("300px");
    expect(scrollHost.style.paddingBottom).toBe("316px");
    expect(frame.scrollIntoView).not.toHaveBeenCalled();
    act(() => listeners.get("keyboardDidShow")?.());
    expect(frame.scrollIntoView).toHaveBeenCalledWith({
      block: "end",
      behavior: "instant",
    });
    expect(frame.style.height).toBe("460px");
    expect(frame.style.width).toBe("100%");
    expect(Keyboard.setResizeMode).toHaveBeenCalledTimes(1);
    expect(Keyboard.setResizeMode).toHaveBeenCalledWith({
      mode: KeyboardResize.None,
    });

    act(() => listeners.get("keyboardDidHide")?.());
    expect(frame.style.scrollMarginBottom).toBe("12px");
    expect(scrollHost.style.paddingBottom).toBe("16px");
    jest.mocked(frame.scrollIntoView).mockClear();
    act(() => listeners.get("keyboardDidShow")?.());
    expect(frame.scrollIntoView).not.toHaveBeenCalled();
    unmount();
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(3));
  });

  it("leaves artwork positioning alone for a zero-height keyboard event", () => {
    render(
      <>
        <CapacitorSetup />
        <iframe title="Interactive artwork" />
      </>
    );
    const frame = document.querySelector("iframe")!;
    frame.scrollIntoView = jest.fn();
    frame.focus();
    act(() => listeners.get("keyboardWillShow")?.(0));
    act(() => listeners.get("keyboardDidShow")?.(0));
    expect(frame.style.scrollMarginBottom).toBe("");
    expect(frame.scrollIntoView).not.toHaveBeenCalled();
  });

  it("restores artwork scroll alignment if unmounted while typing", async () => {
    const { unmount } = render(
      <>
        <CapacitorSetup />
        <iframe title="Interactive artwork" />
      </>
    );
    const frame = document.querySelector("iframe")!;
    frame.style.scrollMarginBottom = "12px";
    frame.focus();
    act(() => listeners.get("keyboardWillShow")?.());
    unmount();
    expect(frame.style.scrollMarginBottom).toBe("12px");
    expect(document.body.style.paddingBottom).toBe("");
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(3));
  });

  it("releases artwork scroll space when focus moves to an app-owned input", () => {
    render(
      <>
        <CapacitorSetup />
        <iframe title="Interactive artwork" />
        <textarea aria-label="Composer" />
      </>
    );
    const frame = document.querySelector("iframe")!;
    frame.focus();
    act(() => listeners.get("keyboardWillShow")?.());
    expect(document.body.style.paddingBottom).toBe("300px");
    document.querySelector("textarea")!.focus();
    expect(frame.style.scrollMarginBottom).toBe("");
    expect(document.body.style.paddingBottom).toBe("");
  });

  it("retains the composer resize mode for app-owned inputs", () => {
    render(
      <>
        <CapacitorSetup />
        <textarea aria-label="Composer" />
      </>
    );
    document.querySelector("textarea")!.focus();
    act(() => listeners.get("keyboardWillShow")?.());
    expect(Keyboard.setResizeMode).toHaveBeenLastCalledWith({
      mode: KeyboardResize.None,
    });
  });

  it("does not change Android keyboard handling", () => {
    setDevice(true, false);
    render(<CapacitorSetup />);
    expect(listeners.size).toBe(0);
    expect(Keyboard.setResizeMode).not.toHaveBeenCalled();
  });
});
