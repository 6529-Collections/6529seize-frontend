import { fetchDesktopAppVersions } from "@/components/apps/appDownloads";

const fetchMock = jest.fn();
const VERSION = "0.3.16";
const ARWEAVE = `https://arweave.net/${"a".repeat(43)}`;
const installer = (
  directory: string,
  arch: string,
  version: string,
  ext: string
) => `6529-DESKTOP-${directory}-${arch}-${version}.${ext}`;
const win = installer("win", "x64", VERSION, "exe");
const mac = installer("mac", "arm64", VERSION, "dmg");
const oldMac = installer("mac", "x64", "0.3.15", "dmg");
const appImage = installer("linux", "x86_64", VERSION, "AppImage");
const deb = installer("linux", "amd64", VERSION, "deb");
const rpm = installer("linux", "x86_64", VERSION, "rpm");

function manifest(version: string, files: string[], minimum?: string) {
  return JSON.stringify({
    version,
    files: files.map((url) => ({ url })),
    ...(minimum ? { minimumSystemVersion: minimum } : {}),
  });
}
const feeds: Record<string, string> = {
  "win/latest.yml": manifest(VERSION, [win]),
  "mac/latest-mac.yml": manifest(VERSION, [mac], "22.0.0"),
  "mac/latest-macos-12.yml": manifest("0.3.15", [oldMac], "21.0.0"),
  "linux/latest-linux.yml": manifest(VERSION, [
    appImage,
    deb,
    deb,
    rpm,
    installer("linux", "x64", VERSION, "zip"),
  ]),
  [`win/links/${VERSION}.json`]: JSON.stringify({
    version: VERSION,
    files: [{ url: win, arweaveUrl: ARWEAVE }],
  }),
};
function mockFeeds(overrides: Record<string, string | null> = {}) {
  const responses = { ...feeds, ...overrides };
  fetchMock.mockImplementation(async (url: string) => {
    const key = url.split("/6529-core-app/")[1]!;
    const body = responses[key];
    return {
      ok: typeof body === "string",
      status: typeof body === "string" ? 200 : 404,
      text: async () => body,
    };
  });
}

describe("feed-driven desktop downloads", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    mockFeeds();
  });

  it("loads current platforms plus the independent macOS 12 release", async () => {
    const apps = await fetchDesktopAppVersions();
    expect(apps.map((app) => app.name)).toEqual(["windows", "mac", "linux"]);
    expect(apps[1]!.releases).toMatchObject([
      { version: VERSION, minimumMacOS: 13, legacyMac: false },
      { version: "0.3.15", minimumMacOS: 12, legacyMac: true },
    ]);
    expect(apps[0]!.releases[0]!.downloads[0]).toMatchObject({
      url: `https://d3lqz0a4bldqgf.cloudfront.net/6529-core-app/win/${win}`,
      arweaveUrl: ARWEAVE,
    });
    expect(apps[2]!.releases[0]!.downloads.map((file) => file.format)).toEqual([
      ".AppImage",
      ".deb",
      ".rpm",
    ]);
  });

  it("reflects a newer feed version without changing frontend code", async () => {
    mockFeeds({
      "win/latest.yml": manifest("0.3.19", [
        installer("win", "arm64", "0.3.19", "exe"),
      ]),
    });
    expect((await fetchDesktopAppVersions())[0]!.releases[0]!.version).toBe(
      "0.3.19"
    );
  });

  it("uses the published files[].url list rather than the updater's top-level path", async () => {
    mockFeeds({
      "mac/latest-mac.yml": JSON.stringify({
        version: VERSION,
        files: [{ url: mac }],
        path: mac.replace(".dmg", ".zip"),
        minimumSystemVersion: "22.0.0",
      }),
    });
    expect(
      (await fetchDesktopAppVersions())[1]!.releases[0]!.downloads[0]!.fileName
    ).toBe(mac);
  });

  it("handles the macOS 26 naming jump and explicit future display metadata", async () => {
    mockFeeds({ "mac/latest-mac.yml": manifest(VERSION, [mac], "25.0.0") });
    expect(
      (await fetchDesktopAppVersions())[1]!.releases[0]!.minimumMacOS
    ).toBe(26);
    mockFeeds({
      "mac/latest-mac.yml": JSON.stringify({
        version: VERSION,
        files: [{ url: mac }],
        minimumSystemVersion: "26.0.0",
        minimumMacOSVersion: "27.0",
      }),
    });
    expect(
      (await fetchDesktopAppVersions())[1]!.releases[0]!.minimumMacOS
    ).toBe(27);
  });

  it("rejects unknown Darwin minima without display metadata and inconsistent requirements", async () => {
    for (const data of [
      {
        version: VERSION,
        files: [{ url: mac }],
        minimumSystemVersion: "26.0.0",
      },
      {
        version: VERSION,
        files: [{ url: mac }],
        minimumSystemVersion: "22.0.0",
        minimumMacOSVersion: "14.0",
      },
    ]) {
      mockFeeds({ "mac/latest-mac.yml": JSON.stringify(data) });
      expect((await fetchDesktopAppVersions())[1]!.releases).toMatchObject([
        { legacyMac: true },
      ]);
    }
  });

  it("keeps legacy recovery downloads when the current Mac feed fails", async () => {
    mockFeeds({ "mac/latest-mac.yml": null });
    const app = (await fetchDesktopAppVersions())[1]!;
    expect(app.hasUnavailableRelease).toBe(true);
    expect(app.releases).toHaveLength(1);
    expect(app.releases[0]!.legacyMac).toBe(true);
  });

  it("does not hide current downloads when legacy or optional mirrors fail", async () => {
    mockFeeds({
      "mac/latest-macos-12.yml": null,
      [`win/links/${VERSION}.json`]: "invalid JSON",
    });
    const apps = await fetchDesktopAppVersions();
    expect(apps[1]!.releases[0]!.version).toBe(VERSION);
    expect(apps[0]!.releases[0]!.downloads[0]!.url).toContain(win);
    expect(apps[0]!.releases[0]!.downloads[0]!.arweaveUrl).toBeUndefined();
  });

  it.each([
    "",
    "version: 123",
    "version: ../unexpected",
    manifest(VERSION, [mac], "13.0.0"),
  ])("keeps other releases when a Mac manifest is unsafe: %p", async (text) => {
    mockFeeds({ "mac/latest-mac.yml": text });
    const apps = await fetchDesktopAppVersions();
    expect(apps[1]!.releases).toHaveLength(1);
    expect(apps[0]!.releases).toHaveLength(1);
  });

  it("ignores external, traversing, stale-version and updater artifacts", async () => {
    mockFeeds({
      "win/latest.yml": manifest(VERSION, [
        win,
        `../${win}`,
        `https://example.com/${win}`,
        installer("win", "x64", "0.3.14", "exe"),
        win.replace(".exe", ".zip"),
      ]),
    });
    expect(
      (await fetchDesktopAppVersions())[0]!.releases[0]!.downloads
    ).toHaveLength(1);
  });

  it("rejects untrusted mirror URLs", async () => {
    mockFeeds({
      [`win/links/${VERSION}.json`]: JSON.stringify({
        version: VERSION,
        files: [{ url: win, arweaveUrl: "https://example.com/trap" }],
      }),
    });
    expect(
      (await fetchDesktopAppVersions())[0]!.releases[0]!.downloads[0]!
        .arweaveUrl
    ).toBeUndefined();
  });

  it("propagates cancellation of the whole query", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener(
            "abort",
            () => reject(options.signal.reason),
            { once: true }
          )
        )
    );
    const pending = fetchDesktopAppVersions(controller.signal);
    const reason = new DOMException("Query cancelled", "AbortError");
    const rejection = expect(pending).rejects.toBe(reason);
    controller.abort(reason);
    await rejection;
  });

  it("bounds hanging manifest requests", async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener(
              "abort",
              () => reject(options.signal.reason),
              { once: true }
            )
          )
      );
      const rejection = expect(fetchDesktopAppVersions()).rejects.toThrow(
        "No desktop app versions"
      );
      await jest.advanceTimersByTimeAsync(10_000);
      await rejection;
    } finally {
      jest.useRealTimers();
    }
  });
});
