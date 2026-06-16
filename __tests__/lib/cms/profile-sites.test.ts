import {
  getPrimaryCmsSitePath,
  getPublishedPrimaryCmsSiteForProfile,
  getPublishedPrimaryCmsSiteForProfileIdentifier,
} from "@/lib/cms/profile-sites";
import { cmsFixturePackages } from "@/lib/cms/fixtures";

function mockFetchJsonResponse(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } satisfies Pick<Response, "ok" | "status" | "json">;

  return jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => response as Response);
}

describe("profile CMS sites", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves the primary CMS site from the backend API", async () => {
    const fetchMock = mockFetchJsonResponse(200, {
      site: {
        primary_static_path: "/api-profile/index.html",
      },
      published_package: {
        static_path: "/api-fallback/index.html",
        package_json: cmsFixturePackages.gallery,
      },
    });

    const site =
      await getPublishedPrimaryCmsSiteForProfileIdentifier("PUNK6529");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/cms\/profile\/punk6529\/primary$/),
      { cache: "no-store" }
    );
    expect(site?.staticPath).toBe("/api-profile/index.html");
    expect(site?.cmsPackage.package_hash).toBe(
      cmsFixturePackages.gallery.package_hash
    );
  });

  it("resolves the primary CMS site for a published profile", async () => {
    mockFetchJsonResponse(404, {});

    const site =
      await getPublishedPrimaryCmsSiteForProfileIdentifier("PUNK6529");

    expect(site?.staticPath).toBe("/punk6529/index.html");
    expect(site?.cmsPackage.payload.site.owner_profile.handle).toBe("punk6529");
  });

  it("does not resolve a CMS site for an unpublished profile", async () => {
    mockFetchJsonResponse(404, {});

    await expect(
      getPublishedPrimaryCmsSiteForProfile({ handle: "unpublished-profile" })
    ).resolves.toBeNull();
  });

  it("builds primary CMS site paths under the profile route", () => {
    expect(getPrimaryCmsSitePath("punk6529")).toBe("/punk6529/index.html");
  });
});
