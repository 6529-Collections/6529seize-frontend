import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import walletGalleryPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/wallet-gallery.package.json";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import {
  buildProfileCmsPath,
  getCmsNavigationItems,
  getCmsPagePath,
  isProfileCmsIndexSegments,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";

const minimalCmsPackage = minimalPackage as unknown as CmsPackageV1;
const galleryCmsPackage = walletGalleryPackage as unknown as CmsPackageV1;

describe("profile CMS runtime routes", () => {
  it("only treats index.html paths as CMS routes", () => {
    expect(isProfileCmsIndexSegments(undefined)).toBe(false);
    expect(isProfileCmsIndexSegments([])).toBe(false);
    expect(isProfileCmsIndexSegments(["collected"])).toBe(false);
    expect(isProfileCmsIndexSegments(["index.html"])).toBe(true);
    expect(isProfileCmsIndexSegments(["collections", "index.html"])).toBe(true);
  });

  it("builds profile-owned CMS paths without claiming the bare profile route", () => {
    expect(
      buildProfileCmsPath({ handle: "punk6529", segments: [] })
    ).toBeNull();
    expect(
      buildProfileCmsPath({ handle: "punk6529", segments: ["index.html"] })
    ).toBe("/punk6529/index.html");
    expect(
      buildProfileCmsPath({ handle: "punk6529", segments: ["Index.html"] })
    ).toBe("/punk6529/index.html");
    expect(
      buildProfileCmsPath({
        handle: "punk6529",
        segments: ["collections", "the-memes", "index.html"],
      })
    ).toBe("/punk6529/collections/the-memes/index.html");
  });

  it("resolves the primary profile CMS route to a page", () => {
    const result = resolveCmsRoute(minimalCmsPackage, "/punk6529/index.html");

    expect(result.kind).toBe("page");
    expect(result.kind === "page" ? result.page.id : null).toBe("page-home");
  });

  it("resolves nested package routes from the route manifest", () => {
    const result = resolveCmsRoute(
      galleryCmsPackage,
      "/punk6529/collections/the-memes/index.html"
    );

    expect(result.kind).toBe("page");
    expect(result.kind === "page" ? result.page.id : null).toBe(
      "page-collection"
    );
  });

  it("fails closed for unsafe redirects", () => {
    const cmsPackage: CmsPackageV1 = {
      ...minimalCmsPackage,
      payload: {
        ...minimalCmsPackage.payload,
        routes: [
          ...minimalCmsPackage.payload.routes,
          {
            path: "/punk6529/go/index.html",
            kind: "redirect",
            target: "javascript:alert(1)",
          },
        ],
      },
    };

    expect(resolveCmsRoute(cmsPackage, "/punk6529/go/index.html")).toEqual({
      kind: "not_found",
      reason: "unsafe_redirect",
    });
  });

  it("fails closed for absolute redirect routes", () => {
    const cmsPackage: CmsPackageV1 = {
      ...minimalCmsPackage,
      payload: {
        ...minimalCmsPackage.payload,
        routes: [
          ...minimalCmsPackage.payload.routes,
          {
            path: "/punk6529/offsite/index.html",
            kind: "redirect",
            target: "https://example.com/phish",
          },
        ],
      },
    };

    expect(resolveCmsRoute(cmsPackage, "/punk6529/offsite/index.html")).toEqual(
      {
        kind: "not_found",
        reason: "unsafe_redirect",
      }
    );
  });

  it("returns navigation and page hrefs from the package manifest", () => {
    expect(
      getCmsNavigationItems(galleryCmsPackage).map((item) => item.label)
    ).toEqual(["Gallery", "The Memes"]);
    expect(getCmsPagePath(galleryCmsPackage, "page-collection")).toBe(
      "/punk6529/collections/the-memes/index.html"
    );
  });
});
