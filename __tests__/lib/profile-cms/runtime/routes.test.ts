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
  it.each(["identity", "Identity", "%69dentity"])(
    "rejects reserved archive namespace %s",
    (segment) => {
      expect(
        buildProfileCmsPath({
          handle: "punk6529",
          segments: [segment, "index.html"],
        })
      ).toBeNull();
      expect(
        buildProfileCmsPath({ handle: "punk6529", segments: ["index.html"] })
      ).toBe("/punk6529/index.html");
    }
  );
  const withRoutes = (
    routes: CmsPackageV1["payload"]["routes"]
  ): CmsPackageV1 => ({
    ...minimalCmsPackage,
    payload: { ...minimalCmsPackage.payload, routes },
  });

  it.each(["/punk6529/Gallery/index.html", "/Punk6529/Gallery/index.html"])(
    "resolves display-case manifest handles for %s without changing page slugs",
    (path) => {
      const cmsPackage = withRoutes([
        {
          path: "/PUNK6529/Gallery/index.html",
          kind: "page",
          page_id: "page-home",
        },
      ]);
      expect(resolveCmsRoute(cmsPackage, path).kind).toBe("page");
      expect(
        resolveCmsRoute(cmsPackage, "/punk6529/gallery/index.html")
      ).toEqual({
        kind: "not_found",
        reason: "route_missing",
      });
      expect(getCmsPagePath(cmsPackage, "page-home")).toBe(
        "/punk6529/Gallery/index.html"
      );
      expect(cmsPackage.payload.routes[0]?.path).toBe(
        "/PUNK6529/Gallery/index.html"
      );
    }
  );

  it.each([false, true])(
    "rejects canonical route collisions regardless of order (reversed: %s)",
    (reversed) => {
      const routes: CmsPackageV1["payload"]["routes"] = [
        { path: "/Punk6529/index.html", kind: "page", page_id: "page-home" },
        {
          path: "/punk6529/index.html",
          kind: "redirect",
          target: "/punk6529/Other/index.html",
        },
      ];
      const cmsPackage = withRoutes(reversed ? routes.toReversed() : routes);
      expect(resolveCmsRoute(cmsPackage, "/punk6529/index.html")).toEqual({
        kind: "not_found",
        reason: "route_missing",
      });
    }
  );

  it("normalizes path aliases and detects cycles across handle casing", () => {
    const cmsPackage = withRoutes([
      {
        path: "/Punk6529/index.html",
        kind: "alias",
        target: "/PUNK6529/Home/index.html",
      },
      { path: "/punk6529/Home/index.html", kind: "alias", target: "page-home" },
      {
        path: "/Punk6529/loop/index.html",
        kind: "alias",
        target: "/punk6529/loop/index.html",
      },
    ]);
    expect(resolveCmsRoute(cmsPackage, "/punk6529/index.html").kind).toBe(
      "page"
    );
    expect(resolveCmsRoute(cmsPackage, "/PUNK6529/loop/index.html")).toEqual({
      kind: "not_found",
      reason: "route_missing",
    });
  });

  it.each([
    [
      "/Punk6529/Gallery/index.html?view=Grid#Artwork",
      "/punk6529/Gallery/index.html?view=Grid#Artwork",
    ],
    ["/Punk6529?view=Grid#Artwork", "/punk6529?view=Grid#Artwork"],
    ["/Punk6529#Artwork", "/punk6529#Artwork"],
  ])(
    "preserves query and fragment casing in redirects to %s",
    (target, expected) => {
      const cmsPackage = withRoutes([
        { path: "/Punk6529/go/index.html", kind: "redirect", target },
      ]);
      expect(
        resolveCmsRoute(cmsPackage, "/punk6529/go/index.html")
      ).toMatchObject({
        kind: "redirect",
        target: expected,
      });
    }
  );

  it("normalizes fallback page paths without changing the package", () => {
    const cmsPackage: CmsPackageV1 = {
      ...minimalCmsPackage,
      payload: {
        ...minimalCmsPackage.payload,
        routes: [],
        pages: minimalCmsPackage.payload.pages.map((page) => ({
          ...page,
          path: "/Punk6529/Home/index.html",
        })),
      },
    };
    expect(getCmsPagePath(cmsPackage, "page-home")).toBe(
      "/punk6529/Home/index.html"
    );
    expect(getCmsPagePath(cmsPackage, "missing")).toBeNull();
    expect(cmsPackage.payload.pages[0]?.path).toBe("/Punk6529/Home/index.html");
  });

  it("normalizes nested internal navigation without rewriting external URLs or anchors", () => {
    const urls = [
      "/Punk6529/Gallery/index.html?view=Grid#Artwork",
      "/Punk6529?view=Grid#Artwork",
      "https://Example.com/Gallery?view=Grid#Artwork",
      "//Example.com/Gallery",
      "#Artwork",
    ];
    const items = [
      { label: "Gallery", children: urls.map((url) => ({ label: url, url })) },
    ];
    const cmsPackage: CmsPackageV1 = {
      ...minimalCmsPackage,
      site: { ...minimalCmsPackage.site, navigation_id: "navigation-test" },
      payload: {
        ...minimalCmsPackage.payload,
        navigation: [{ id: "navigation-test", items }],
      },
    };
    expect(
      getCmsNavigationItems(cmsPackage)[0]?.children?.map((item) => item.url)
    ).toEqual([
      "/punk6529/Gallery/index.html?view=Grid#Artwork",
      "/punk6529?view=Grid#Artwork",
      ...urls.slice(2),
    ]);
    expect(items[0]?.children.map((item) => item.url)).toEqual(urls);
  });

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
