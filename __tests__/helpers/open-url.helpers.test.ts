import { getOpenableUrl, openUrlInNewTab } from "@/helpers/open-url.helpers";

jest.mock("@/config/env", () => ({
  publicEnv: { MEDIA_RESOLVER_ENDPOINT: "https://media.6529.io" },
}));

describe("getOpenableUrl", () => {
  it.each([
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/a.png",
    "https://generator.6529.io/mainnet/html/42?render_static=true",
  ])("opens %s as it is", (url) => {
    expect(getOpenableUrl(url)).toBe(url);
  });

  it("opens decentralized media through the media resolver", () => {
    expect(
      getOpenableUrl(
        "ipfs://bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/art.png"
      )
    ).toBe(
      "https://media.6529.io/ipfs/bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/art.png"
    );
  });

  it("opens HTTP and object URLs only on this page's origin", () => {
    const origin = globalThis.window.location.origin;
    expect(getOpenableUrl(`blob:${origin}/local-id`)).toBe(
      `blob:${origin}/local-id`
    );
    expect(getOpenableUrl("/media/a.png")).toBe(`${origin}/media/a.png`);
    expect(getOpenableUrl("http://media.example/a.png")).toBeNull();
    expect(getOpenableUrl("blob:https://other.example/id")).toBeNull();
  });

  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "file:///etc/passwd",
    "vbscript:msgbox(1)",
    "ipfs://",
    "",
    null,
    undefined,
  ])("refuses %j", (url) => {
    expect(getOpenableUrl(url)).toBeNull();
  });
});

describe("openUrlInNewTab", () => {
  it("opens without an opener or referrer", () => {
    const open = jest.spyOn(globalThis.window, "open").mockReturnValue(null);
    expect(openUrlInNewTab("https://example.com/a.png")).toBe(true);
    expect(open).toHaveBeenCalledWith(
      "https://example.com/a.png",
      "_blank",
      "noopener,noreferrer"
    );
    open.mockRestore();
  });

  it("does not open a refused URL", () => {
    const open = jest.spyOn(globalThis.window, "open").mockReturnValue(null);
    expect(openUrlInNewTab("javascript:alert(1)")).toBe(false);
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
