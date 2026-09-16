import OpenMobilePage from "@/app/open-mobile/page";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { Capacitor } from "@capacitor/core";
import { fireEvent, render, screen } from "@testing-library/react";

let searchParams: URLSearchParams;
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace }),
}));
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn(() => false) },
  };
});

beforeEach(() => {
  searchParams = new URLSearchParams({ path: "/waves/123?drop=456#part-2" });
  jest.spyOn(window, "open").mockReturnValue(null);
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  replace.mockReset();
});
afterEach(() => jest.restoreAllMocks());

test("does not auto-launch or show Opening, and offers all three actions", () => {
  render(<OpenMobilePage />);
  expect(window.open).not.toHaveBeenCalled();
  expect(screen.queryByText(/Opening/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open app" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Download" })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Continue in browser" })
  ).toHaveAttribute("href", "/waves/123?drop=456#part-2");
});

test.each([false, true])(
  "preserves query, fragment and repeated values, extra encoding: %s",
  (extraEncoding) => {
    const destination =
      "/waves/123?drop=456&tag=a&tag=b&search=a%26b%23c#drop-456";
    searchParams = new URLSearchParams({
      path: extraEncoding ? encodeURIComponent(destination) : destination,
    });
    render(<OpenMobilePage />);
    fireEvent.click(screen.getByRole("button", { name: "Open app" }));
    expect(window.open).toHaveBeenCalledWith(
      `testmobile6529://navigate${destination}`,
      "_self"
    );
    expect(screen.getByRole("status")).toHaveTextContent("App didn’t open?");
    expect(
      screen.getByRole("link", { name: "Continue in browser" })
    ).toHaveAttribute("href", destination);
  }
);

test.each([
  null,
  "",
  "/bad%",
  "%E0%A4%A",
  "//example.com/path",
  "/%2Fexample.com/path",
  "/\\example.com",
  "/open-mobile?path=/",
  "/auth/callback",
])("uses a non-automatic home fallback for %j", (path) => {
  searchParams = new URLSearchParams(path === null ? {} : { path });
  render(<OpenMobilePage />);
  expect(window.open).not.toHaveBeenCalled();
  expect(
    screen.getByRole("link", { name: "Continue in browser" })
  ).toHaveAttribute("href", "/");
  fireEvent.click(screen.getByRole("button", { name: "Open app" }));
  expect(window.open).toHaveBeenCalledWith(
    "testmobile6529://navigate/",
    "_self"
  );
});

test("clears a previous destination and recovery status on query change", () => {
  const { rerender } = render(<OpenMobilePage />);
  fireEvent.click(screen.getByRole("button", { name: "Open app" }));
  searchParams = new URLSearchParams();
  rerender(<OpenMobilePage />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Continue in browser" })
  ).toHaveAttribute("href", "/");
});

test("does not loop through Android intent fallback on retry", () => {
  jest
    .spyOn(navigator, "userAgent", "get")
    .mockReturnValue("Android Chrome/140");
  render(<OpenMobilePage />);
  fireEvent.click(screen.getByRole("button", { name: "Open app" }));
  expect(window.open).toHaveBeenCalledWith(
    "testmobile6529://navigate/waves/123?drop=456#part-2",
    "_self"
  );
});

test("opens the destination internally when already in the native app", () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  render(<OpenMobilePage />);
  fireEvent.click(screen.getByRole("button", { name: "Open app" }));
  expect(replace).toHaveBeenCalledWith("/waves/123?drop=456#part-2");
  expect(window.open).not.toHaveBeenCalled();
});

test.each([
  { ua: "iPhone", expected: [MOBILE_APP_IOS] },
  { ua: "Android", expected: [MOBILE_APP_ANDROID] },
  { ua: "Desktop", expected: [MOBILE_APP_IOS, MOBILE_APP_ANDROID] },
])("offers correct store actions on $ua", ({ ua, expected }) => {
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
  render(<OpenMobilePage />);
  const stores = screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("target") === "_self");
  expect(stores.map((link) => link.getAttribute("href"))).toEqual(expected);
});
