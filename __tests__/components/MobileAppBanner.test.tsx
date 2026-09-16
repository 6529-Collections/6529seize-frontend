import { act, fireEvent, render, screen } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import MobileAppBanner from "@/components/mobile-app/MobileAppBanner";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";

const MOBILE_APP_DISMISSAL_KEY = "6529-mobile-banner-dismissed-until";
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
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone Safari");
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
});
afterEach(() => {
  jest.restoreAllMocks();
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
