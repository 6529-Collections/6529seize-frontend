import {
  fetchDesktopAppVersions,
  getDesktopAppDownloadUrl,
  type DesktopAppVersion,
} from "@/components/apps/appDownloads";

const fetchMock = jest.fn();

describe("desktop app downloads", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
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
});

function releaseResponse(version: string) {
  return {
    ok: true,
    text: jest.fn().mockResolvedValue(`version: ${version}`),
  };
}
