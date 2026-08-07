import {
  isPageShareSupported,
  PAGE_SHARE_UNSUPPORTED_PATHS,
} from "@/components/header/share/page-share-support";

describe("page share support", () => {
  it.each(PAGE_SHARE_UNSUPPORTED_PATHS)(
    "hides Share on unsupported path %s",
    (pathname) => {
      expect(isPageShareSupported({ activeView: null, pathname })).toBe(false);
    }
  );

  it.each(["/messages/create", "/notifications/settings"])(
    "hides Share on unsupported child path %s",
    (pathname) => {
      expect(isPageShareSupported({ activeView: null, pathname })).toBe(false);
    }
  );

  it.each(["messages"])("hides Share in the %s query view", (activeView) => {
    expect(isPageShareSupported({ activeView, pathname: "/alice" })).toBe(
      false
    );
  });

  it.each(["/alice", "/network", "/museum/genesis", "/waves", "/waves/abc"])(
    "shows Share on supported path %s",
    (pathname) => {
      expect(isPageShareSupported({ activeView: null, pathname })).toBe(true);
    }
  );

  it("shows Share in the waves query view", () => {
    expect(
      isPageShareSupported({ activeView: "waves", pathname: "/alice" })
    ).toBe(true);
  });
});
