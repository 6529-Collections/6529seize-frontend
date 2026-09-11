import {
  isPageShareSupported,
  PAGE_SHARE_UNSUPPORTED_PATHS,
} from "@/components/header/share/page-share-support";

describe("page share support", () => {
  it.each(PAGE_SHARE_UNSUPPORTED_PATHS)(
    "hides Share on unsupported path %s",
    (pathname) => {
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "desktop-web",
        })
      ).toBe(false);
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "mobile",
        })
      ).toBe(false);
    }
  );

  it.each(["/messages/create", "/notifications/settings"])(
    "hides Share on unsupported child path %s",
    (pathname) => {
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "desktop-web",
        })
      ).toBe(false);
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "mobile",
        })
      ).toBe(false);
    }
  );

  it("hides Share in the messages query view on every surface", () => {
    expect(
      isPageShareSupported({
        activeView: "messages",
        pathname: "/alice",
        surface: "mobile",
      })
    ).toBe(false);
    expect(
      isPageShareSupported({
        activeView: "messages",
        pathname: "/alice",
        surface: "desktop-web",
      })
    ).toBe(false);
  });

  it.each(["/alice", "/network", "/museum/genesis", "/waves", "/waves/abc"])(
    "shows Share on supported path %s",
    (pathname) => {
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "mobile",
        })
      ).toBe(true);
      expect(
        isPageShareSupported({
          activeView: null,
          pathname,
          surface: "desktop-web",
        })
      ).toBe(true);
    }
  );

  it("shows Share in the waves query view", () => {
    expect(
      isPageShareSupported({
        activeView: "waves",
        pathname: "/alice",
        surface: "mobile",
      })
    ).toBe(true);
    expect(
      isPageShareSupported({
        activeView: "waves",
        pathname: "/alice",
        surface: "desktop-web",
      })
    ).toBe(true);
  });

  it("shows Share on home for desktop web", () => {
    expect(
      isPageShareSupported({
        activeView: null,
        pathname: "/",
        surface: "desktop-web",
      })
    ).toBe(true);
  });

  it("hides Share on home for mobile", () => {
    expect(
      isPageShareSupported({
        activeView: null,
        pathname: "/",
        surface: "mobile",
      })
    ).toBe(false);
  });
});
