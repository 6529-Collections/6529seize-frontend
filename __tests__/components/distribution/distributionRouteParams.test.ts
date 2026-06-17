import {
  getDistributionDetailHref,
  getDistributionRouteHrefWithLocale,
  getDistributionRouteLocale,
} from "@/components/distribution/distributionRouteParams";

describe("distributionRouteParams", () => {
  it("normalizes route locale values", () => {
    expect(getDistributionRouteLocale({})).toBe("en-US");
    expect(getDistributionRouteLocale({ locale: "de-DE" })).toBe("de-DE");
    expect(getDistributionRouteLocale({ locale: ["fr-FR", "de-DE"] })).toBe(
      "fr-FR"
    );
    expect(getDistributionRouteLocale({ locale: "en-UK" })).toBe("en-US");
  });

  it("preserves non-default locale in route hrefs", () => {
    expect(
      getDistributionRouteHrefWithLocale({
        href: "/meme-lab/1/distribution",
        locale: "de-DE",
      })
    ).toBe("/meme-lab/1/distribution?locale=de-DE");
  });

  it("removes stale locale params for the default locale", () => {
    expect(
      getDistributionRouteHrefWithLocale({
        href: "/meme-lab/1/distribution?locale=de-DE&focus=collectors",
        locale: "en-US",
      })
    ).toBe("/meme-lab/1/distribution?focus=collectors");
  });

  it("builds encoded distribution detail hrefs", () => {
    expect(
      getDistributionDetailHref({
        basePath: "/meme-lab",
        id: "abc 123",
        locale: "fr-FR",
      })
    ).toBe("/meme-lab/abc%20123/distribution?locale=fr-FR");
  });
});
