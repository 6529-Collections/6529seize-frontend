import {
  getDesktopLinkAction,
  getDesktopNavigationTarget,
} from "@/helpers/desktop-navigation";

const ORIGIN = "http://localhost:6529";

describe("getDesktopNavigationTarget", () => {
  it("accepts a same-origin path with query and hash", () => {
    expect(
      getDesktopNavigationTarget(
        "/accept-connection-sharing?connection_share_code=abc&address=0x1#device_setup_key=k",
        ORIGIN,
        "/"
      )
    ).toEqual({
      url: "/accept-connection-sharing?connection_share_code=abc&address=0x1#device_setup_key=k",
      replace: false,
    });
  });

  it("reloads the page already open instead of growing history", () => {
    expect(
      getDesktopNavigationTarget("/waves?wave=1", ORIGIN, "/waves")
    ).toEqual({ url: "/waves?wave=1&reload=true", replace: true });
  });

  it.each([
    "https://evil.example/",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "waves",
    "",
  ])("refuses %p", (value) => {
    expect(getDesktopNavigationTarget(value, ORIGIN, "/")).toBeNull();
  });
});

const link = (href: string | null, attributes: Record<string, string> = {}) => {
  const anchor = document.createElement("a");
  if (href !== null) anchor.setAttribute("href", href);
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value);
  }
  return anchor;
};

const click = (
  overrides: Partial<MouseEventInit & { defaultPrevented: boolean }> = {}
) => ({
  button: overrides.button ?? 0,
  ctrlKey: overrides.ctrlKey ?? false,
  metaKey: overrides.metaKey ?? false,
  shiftKey: overrides.shiftKey ?? false,
  defaultPrevented: overrides.defaultPrevented ?? false,
});

describe("getDesktopLinkAction", () => {
  it("leaves ordinary same-window links alone", () => {
    expect(getDesktopLinkAction(link("/waves"), click(), ORIGIN)).toBeNull();
    expect(
      getDesktopLinkAction(link("https://example.com"), click(), ORIGIN)
    ).toBeNull();
  });

  it("navigates in place for an own page opened in a new window", () => {
    expect(
      getDesktopLinkAction(
        link("/the-memes/1?x=1#top", { target: "_blank" }),
        click(),
        ORIGIN
      )
    ).toEqual({ kind: "navigate", url: "/the-memes/1?x=1#top" });
    expect(
      getDesktopLinkAction(
        link(`${ORIGIN}/waves`),
        click({ ctrlKey: true }),
        ORIGIN
      )
    ).toEqual({ kind: "navigate", url: "/waves" });
  });

  it("opens other sites in the system browser", () => {
    expect(
      getDesktopLinkAction(
        link("https://opensea.io/x", { target: "_blank" }),
        click(),
        ORIGIN
      )
    ).toEqual({ kind: "external", url: "https://opensea.io/x" });
    expect(
      getDesktopLinkAction(
        link("https://example.com"),
        click({ button: 1 }),
        ORIGIN
      )
    ).toEqual({ kind: "external", url: "https://example.com/" });
  });

  it.each([
    [
      "a handled click",
      link("https://example.com", { target: "_blank" }),
      click({ defaultPrevented: true }),
    ],
    [
      "a download",
      link("/file.csv", { target: "_blank", download: "" }),
      click(),
    ],
    [
      "a right click",
      link("https://example.com", { target: "_blank" }),
      click({ button: 2 }),
    ],
    ["a fragment", link("#section", { target: "_blank" }), click()],
    ["a missing href", link(null, { target: "_blank" }), click()],
    [
      "another scheme",
      link("mailto:hi@example.com", { target: "_blank" }),
      click(),
    ],
    ["javascript", link("javascript:alert(1)", { target: "_blank" }), click()],
  ])("ignores %s", (_name, anchor, event) => {
    expect(getDesktopLinkAction(anchor, event, ORIGIN)).toBeNull();
  });
});
