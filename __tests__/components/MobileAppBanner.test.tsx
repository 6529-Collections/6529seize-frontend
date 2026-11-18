import { runInNewContext } from "node:vm";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import { SMALL_WEB_STARTUP_SCRIPT } from "@/components/layout/smallWebStartup";
import MobileAppBanner from "@/components/mobile-app/MobileAppBanner";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { MOBILE_APP_DISMISSAL_KEY } from "@/helpers/mobileAppLinks";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const IPAD_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1";

const MOBILE_APP_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn(() => false) },
  };
});

beforeEach(() => {
  pathname = "/";
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_CHROME);
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
});
afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(navigator, "maxTouchPoints");
  jest.useRealTimers();
});

test("shows the approved logo, store link, Open and dismiss controls", () => {
  const { container } = render(<MobileAppBanner />);
  expect(
    screen.getByRole("complementary", { name: "Open in 6529 Mobile" })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Get the app" })).toHaveAttribute(
    "href",
    MOBILE_APP_IOS
  );
  expect(container.querySelector("img")).toHaveAttribute("src", "/6529.svg");
  expect(
    screen.getByRole("button", { name: "Open in 6529 Mobile" })
  ).toHaveTextContent("Open");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("opens the live destination without adding a status message", () => {
  const open = jest.spyOn(window, "open").mockReturnValue(null);
  render(<MobileAppBanner />);
  window.history.replaceState({}, "", "/waves/123?drop=456&tag=a&tag=b#part-2");
  fireEvent.click(screen.getByRole("button", { name: "Open in 6529 Mobile" }));
  expect(open).toHaveBeenCalledWith(
    "testmobile6529://navigate/waves/123?drop=456&tag=a&tag=b#part-2",
    "_self"
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Get the app" })).toBeInTheDocument();
});

test("a thrown browser launch error leaves the page and recovery actions usable", () => {
  jest.spyOn(window, "open").mockImplementation(() => {
    throw new Error("blocked");
  });
  render(<MobileAppBanner />);
  fireEvent.click(screen.getByRole("button", { name: "Open in 6529 Mobile" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Get the app" })).toHaveAttribute(
    "href",
    MOBILE_APP_IOS
  );
  expect(window.location.pathname).toBe("/");
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss app banner for seven days" })
  );
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("dismissal persists across remounts and expires after exactly seven days", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-09-15T12:00:00Z"));
  const { unmount } = render(<MobileAppBanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss app banner for seven days" })
  );
  expect(Number(localStorage.getItem(MOBILE_APP_DISMISSAL_KEY))).toBe(
    Date.now() + MOBILE_APP_DISMISSAL_MS
  );
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  unmount();
  render(<MobileAppBanner />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(MOBILE_APP_DISMISSAL_MS - 1));
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1));
  expect(screen.getByRole("complementary")).toBeInTheDocument();
});

test("responds to dismissal in another tab and storage clearing", () => {
  render(<MobileAppBanner />);
  act(() => {
    localStorage.setItem(
      MOBILE_APP_DISMISSAL_KEY,
      String(Date.now() + MOBILE_APP_DISMISSAL_MS)
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: MOBILE_APP_DISMISSAL_KEY })
    );
  });
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage"));
  });
  expect(screen.getByRole("complementary")).toBeInTheDocument();
});

test.each(["nonsense", "NaN", "Infinity", "-1"])(
  "ignores invalid dismissal value %s",
  (value) => {
    localStorage.setItem(MOBILE_APP_DISMISSAL_KEY, value);
    render(<MobileAppBanner />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  }
);

test.each([
  "/open-mobile",
  "/auth/callback",
  "/accept-connection-sharing",
  "/app-wallets",
  "/tools/app-wallets",
  "/tools/app-wallets/import-wallet",
  "/tools/app-wallets/0x123",
  "/access",
])("does not show on handoff route %s", (path) => {
  pathname = path;
  render(<MobileAppBanner />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test.each(["Macintosh", "Windows", "iPhone Electron"])(
  "does not show in desktop browsers or Electron: %s",
  (ua) => {
    jest.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
    render(<MobileAppBanner />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  }
);

test("does not show in the mobile app", () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  render(<MobileAppBanner />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test.each([
  { ua: IPHONE_SAFARI, expected: false },
  { ua: IPAD_SAFARI, maxTouchPoints: 5, expected: false },
  { ua: IPHONE_CHROME, expected: true },
  {
    ua: IPHONE_SAFARI.replace("Version/26.0", "Version/26.0 FxiOS/140"),
    expected: true,
  },
  { ua: "Android Mobile Chrome/140" },
  { ua: IPHONE_CHROME, path: "/%61uth/callback" },
  { ua: IPHONE_CHROME, path: "/%invalid" },
  { ua: IPHONE_CHROME, dismissal: "future" },
  { ua: IPHONE_CHROME, dismissal: "Infinity" },
  { ua: IPHONE_CHROME, native: true },
  { ua: "iPhone Electron" },
])(
  "reserves startup space when the hydrated banner renders: %j",
  ({
    ua,
    path = "/safe-collecting",
    dismissal,
    native = false,
    expected,
    maxTouchPoints = 1,
  }) => {
    pathname = path;
    jest.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: maxTouchPoints,
      configurable: true,
    });
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    if (dismissal) {
      localStorage.setItem(
        MOBILE_APP_DISMISSAL_KEY,
        dismissal === "future" ? String(Date.now() + 60_000) : dismissal
      );
    }

    const setAttribute = jest.fn();
    runInNewContext(SMALL_WEB_STARTUP_SCRIPT, {
      innerWidth: 390,
      navigator,
      location: { pathname },
      localStorage,
      document: {
        documentElement: { hasAttribute: () => native, setAttribute },
      },
    });
    render(<MobileAppBanner />);

    const reserved = setAttribute.mock.calls.some(
      ([name]) => name === "data-small-web-banner"
    );
    const visible = screen.queryByRole("complementary") !== null;
    expect(reserved).toBe(visible);
    if (expected !== undefined) expect(visible).toBe(expected);
  }
);

test("uses Google Play on Android", () => {
  jest
    .spyOn(navigator, "userAgent", "get")
    .mockReturnValue("Android Chrome/140");
  render(<MobileAppBanner />);
  expect(screen.getByRole("link", { name: "Get the app" })).toHaveAttribute(
    "href",
    MOBILE_APP_ANDROID
  );
});

test("dismissal still works when storage writes are blocked", () => {
  jest.useFakeTimers();
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const { unmount } = render(<MobileAppBanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss app banner for seven days" })
  );
  unmount();
  render(<MobileAppBanner />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(MOBILE_APP_DISMISSAL_MS));
  expect(screen.getByRole("complementary")).toBeInTheDocument();
});
