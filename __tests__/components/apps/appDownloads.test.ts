import {
  fetchDesktopAppVersions,
  getDesktopAppDownloadUrl,
  type DesktopAppVersion,
} from "@/components/apps/appDownloads";

const fetchMock = jest.fn();

describe("desktop app downloads", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("resolves the current release for every available platform", async () => {
    fetchMock
      .mockResolvedValueOnce(releaseResponse("1.2.3"))
      .mockResolvedValueOnce(releaseResponse("2.3.4"))
      .mockResolvedValueOnce(releaseResponse("3.4.5"));

    await expect(fetchDesktopAppVersions()).resolves.toMatchObject([
      { name: "windows", version: "1.2.3" },
      { name: "mac", version: "2.3.4" },
      { name: "linux", version: "3.4.5" },
    ]);
  });

  it("keeps available platforms when one release manifest fails", async () => {
    fetchMock
      .mockResolvedValueOnce(releaseResponse("1.2.3"))
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce(releaseResponse("3.4.5"));

    const versions = await fetchDesktopAppVersions();

    expect(versions.map((app) => app.name)).toEqual(["windows", "linux"]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch or process macOS release",
      expect.any(Error)
    );
  });

  it.each(["", "version: 123", "version: ../unexpected"])(
    "drops a release manifest with invalid YAML data: %p",
    async (manifest) => {
      fetchMock
        .mockResolvedValueOnce(manifestResponse(manifest))
        .mockResolvedValueOnce(releaseResponse("2.3.4"))
        .mockResolvedValueOnce(releaseResponse("3.4.5"));

      const versions = await fetchDesktopAppVersions();

      expect(versions.map((app) => app.name)).toEqual(["mac", "linux"]);
    }
  );

  it("passes an abort signal to every release-manifest request", async () => {
    fetchMock.mockResolvedValue(releaseResponse("1.2.3"));
    const controller = new AbortController();

    await fetchDesktopAppVersions(controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("propagates query cancellation without logging release failures", async () => {
    const controller = new AbortController();
    const reason = new DOMException("Query cancelled", "AbortError");
    fetchMock.mockImplementation(
      (_url: string, options: { readonly signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            "abort",
            () => reject(options.signal.reason),
            { once: true }
          );
        })
    );

    const versionsPromise = fetchDesktopAppVersions(controller.signal);
    const rejection = expect(versionsPromise).rejects.toBe(reason);
    controller.abort(reason);

    await rejection;
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("aborts release-manifest requests after the timeout", async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_url: string, options: { readonly signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true }
            );
          })
      );

      const versionsPromise = fetchDesktopAppVersions();
      const rejection = expect(versionsPromise).rejects.toThrow(
        "No desktop app versions are currently available"
      );
      await jest.advanceTimersByTimeAsync(10_000);

      await rejection;
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports an unavailable state when every release manifest fails", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(fetchDesktopAppVersions()).rejects.toThrow(
      "No desktop app versions are currently available"
    );
  });

  it("builds the versioned desktop download URL", () => {
    const app: DesktopAppVersion = {
      name: "mac",
      displayName: "macOS",
      downloadPath: "6529-core-app/mac/links",
      image: "/macos.png",
      version: "4.5.6",
    };

    expect(getDesktopAppDownloadUrl(app)).toBe(
      "https://d3lqz0a4bldqgf.cloudfront.net/6529-core-app/mac/links/4.5.6.html"
    );
  });

  it("rejects an unsafe version when building a desktop download URL", () => {
    const app: DesktopAppVersion = {
      name: "mac",
      displayName: "macOS",
      downloadPath: "6529-core-app/mac/links",
      image: "/macos.png",
      version: "../unexpected?file=1",
    };

    expect(() => getDesktopAppDownloadUrl(app)).toThrow(
      "Invalid desktop app version"
    );
  });
});

function releaseResponse(version: string) {
  return manifestResponse(`version: ${version}`);
}

function manifestResponse(manifest: string) {
  return {
    ok: true,
    text: jest.fn().mockResolvedValue(manifest),
  };
}
