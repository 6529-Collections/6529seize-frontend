import { readDesktopDownloadPage } from "@/lib/desktop/updateDownloadPage";

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://staging.6529.io" },
}));

describe("readDesktopDownloadPage", () => {
  it("keeps an https page on 6529.io or on this build's own site", () => {
    expect(
      readDesktopDownloadPage({ downloadPage: "https://6529.io/desktop#mac" })
    ).toBe("https://6529.io/desktop#mac");
    expect(
      readDesktopDownloadPage({
        downloadPage: "https://staging.6529.io/desktop",
      })
    ).toBe("https://staging.6529.io/desktop");
  });

  it.each([
    [null],
    [{}],
    [{ downloadPage: "http://6529.io/desktop" }],
    [{ downloadPage: "http://staging.6529.io/desktop" }],
    [{ downloadPage: "https://dev.6529.io/desktop" }],
    [{ downloadPage: "http://localhost:3001/desktop" }],
    [{ downloadPage: "https://a:b@6529.io/desktop" }],
    [{ downloadPage: `https://6529.io/${"a".repeat(2100)}` }],
    [{ downloadPage: "file:///C:/x.exe" }],
  ])("falls back to the 6529.io download page for %j", (info) => {
    expect(readDesktopDownloadPage(info)).toBe("https://6529.io/desktop");
  });
});
