import {
  getPrimaryCmsSitePath,
  getPublishedPrimaryCmsSiteForProfile,
  getPublishedPrimaryCmsSiteForProfileIdentifier,
} from "@/lib/cms/profile-sites";
import { cmsFixturePackages } from "@/lib/cms/fixtures";

function mockFetchResponse(response: Pick<Response, "ok" | "status" | "json">) {
  return jest
    .spyOn(global, "fetch")
    .mockResolvedValue(response as unknown as Response);
}

describe("profile CMS sites", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves the primary CMS site from the backend API", async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: async () => ({
        site: {
          primary_static_path: "/api-profile/index.html",
        },
        published_package: {
          static_path: "/api-fallback/index.html",
          package_json: cmsFixturePackages.gallery,
        },
      }),
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
    mockFetchResponse({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const site =
      await getPublishedPrimaryCmsSiteForProfileIdentifier("PUNK6529");

    expect(site?.staticPath).toBe("/punk6529/index.html");
    expect(site?.cmsPackage.payload.site.owner_profile.handle).toBe("punk6529");
  });

  it("does not resolve a CMS site for an unpublished profile", async () => {
    mockFetchResponse({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await expect(
      getPublishedPrimaryCmsSiteForProfile({ handle: "unpublished-profile" })
    ).resolves.toBeNull();
  });

  it("builds primary CMS site paths under the profile route", () => {
    expect(getPrimaryCmsSitePath("punk6529")).toBe("/punk6529/index.html");
  });
});
