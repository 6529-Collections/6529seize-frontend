import { readdirSync } from "node:fs";
import path from "node:path";
import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import {
  buildProfileCmsPath,
  getCmsNavigationItems,
  getCmsPagePath,
  getCmsPublicPagePath,
  getCmsPublicPath,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import {
  CMS_RESERVED_PROFILE_SEGMENTS,
  isValidCmsPageSlug,
} from "@/lib/profile-cms/runtime/page-slugs";

const fixture = minimalPackage as unknown as CmsPackageV1;
const studioPackage: CmsPackageV1 = {
  ...fixture,
  site: { ...fixture.site, base_path: "/punk6529/studio/index.html" },
  payload: {
    ...fixture.payload,
    pages: fixture.payload.pages.map((page) => ({
      ...page,
      path: "/punk6529/studio/index.html",
    })),
    routes: [
      {
        path: "/punk6529/index.html",
        kind: "alias",
        target: "/punk6529/studio/index.html",
      },
      {
        path: "/punk6529/studio/index.html",
        kind: "page",
        page_id: "page-home",
      },
    ],
  },
};

describe("readable CMS page addresses", () => {
  it("serves the same declared page for a readable and archive address", () => {
    const before = JSON.stringify(studioPackage);
    for (const segments of [["studio"], ["studio", "index.html"]]) {
      const archivePath = buildProfileCmsPath({ handle: "punk6529", segments });
      expect(archivePath).toBe("/punk6529/studio/index.html");
      expect(resolveCmsRoute(studioPackage, archivePath!)).toMatchObject({
        kind: "page",
        page: { id: "page-home" },
      });
    }
    expect(getCmsPagePath(studioPackage, "page-home")).toBe(
      "/punk6529/studio/index.html"
    );
    expect(getCmsPublicPagePath(studioPackage, "page-home")).toBe(
      "/punk6529/studio"
    );
    expect(getCmsPublicPath(studioPackage, "/punk6529/index.html")).toBe(
      "/punk6529/studio"
    );
    expect(JSON.stringify(studioPackage)).toBe(before);
  });

  it("keeps the profile, external destinations, assets, and missing routes intact", () => {
    for (const value of [
      "/punk6529",
      "/punk6529/identity",
      "/punk6529/missing/index.html",
      "https://example.com/work/index.html",
      "https://images.example/art.png",
      "ar://publication/index.html",
    ]) {
      expect(getCmsPublicPath(studioPackage, value)).toBe(value);
    }
    expect(getCmsPublicPagePath(studioPackage, "missing")).toBeNull();
    expect(getCmsPublicPagePath(fixture, "page-home")).toBe(
      "/punk6529/index.html"
    );
  });

  it("preserves query and fragment data on known links and nested navigation", () => {
    const url = "/Punk6529/studio/index.html?view=Grid#SelectedWorks";
    const cmsPackage: CmsPackageV1 = {
      ...studioPackage,
      payload: {
        ...studioPackage.payload,
        navigation: [
          {
            id: studioPackage.site.navigation_id,
            items: [{ label: "Menu", children: [{ label: "Studio", url }] }],
          },
        ],
      },
    };
    expect(getCmsPublicPath(cmsPackage, url)).toBe(
      "/punk6529/studio?view=Grid#SelectedWorks"
    );
    expect(getCmsNavigationItems(cmsPackage)[0]?.children?.[0]?.url).toBe(
      "/punk6529/studio?view=Grid#SelectedWorks"
    );
    expect(cmsPackage.payload.navigation[0]?.items[0]?.children?.[0]?.url).toBe(
      url
    );
  });

  it("retains legacy slug case and supports nested readable routes", () => {
    expect(
      buildProfileCmsPath({
        handle: "punk6529",
        segments: ["Work", "series-1"],
      })
    ).toBe("/punk6529/Work/series-1/index.html");
    expect(
      buildProfileCmsPath({ handle: "punk6529", segments: ["about"] })
    ).toBe("/punk6529/about/index.html");
  });

  it.each([
    [],
    ["identity"],
    ["cms", "builder"],
    ["%63ms", "anything"],
    ["..", "studio"],
    ["%2e%2e", "studio"],
    ["studio%2fprivate"],
    ["studio%5cprivate"],
    ["%zz"],
    ["%252f"],
    ["studio?view=grid"],
    ["studio#heading"],
  ])("does not claim unsafe or application segments %j", (...segments) => {
    expect(buildProfileCmsPath({ handle: "punk6529", segments })).toBeNull();
  });

  it("only offers authoring slugs that cannot shadow profile application routes", () => {
    for (const slug of ["studio", "selected-works", "about", "2026"]) {
      expect(isValidCmsPageSlug(slug)).toBe(true);
    }
    for (const slug of [
      ...CMS_RESERVED_PROFILE_SEGMENTS,
      "Selected-Works",
      "two words",
      "../works",
      "works/series",
      "%63ms",
      "a".repeat(81),
      "-works",
      "works-",
      "",
    ]) {
      expect(isValidCmsPageSlug(slug)).toBe(false);
    }
    const staticProfileChildren = readdirSync(
      path.join(process.cwd(), "app", "[user]"),
      {
        withFileTypes: true,
      }
    )
      .filter((entry) => entry.isDirectory() && /^[a-z]/.test(entry.name))
      .map((entry) => entry.name);
    expect([...CMS_RESERVED_PROFILE_SEGMENTS].sort()).toEqual(
      staticProfileChildren.sort()
    );
  });
});
