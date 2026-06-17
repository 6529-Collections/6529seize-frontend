import {
  getSearchParamValue,
  getTheMemesBrowseHref,
  getTheMemesDetailHref,
  getTheMemesRouteHrefWithLocale,
  getTheMemesRouteLocale,
} from "@/components/the-memes/theMemesRouteParams";

describe("The Memes route params", () => {
  it("normalizes search param values and locale", () => {
    expect(getSearchParamValue(["de-DE", "en-US"])).toBe("de-DE");
    expect(getSearchParamValue(undefined)).toBeNull();
    expect(getTheMemesRouteLocale({ locale: "DE-de" })).toBe("de-DE");
    expect(getTheMemesRouteLocale({ locale: "unsupported-LC" })).toBe("en-US");
  });

  it("builds locale-preserving route hrefs", () => {
    expect(
      getTheMemesRouteHrefWithLocale({
        href: "/the-memes",
        locale: "en-US",
      })
    ).toBe("/the-memes");
    expect(
      getTheMemesRouteHrefWithLocale({
        href: "/the-memes?sort=age",
        locale: "de-DE",
      })
    ).toBe("/the-memes?sort=age&locale=de-DE");
    expect(
      getTheMemesRouteHrefWithLocale({
        href: "/the-memes?sort=age&locale=fr-FR",
        locale: "de-DE",
      })
    ).toBe("/the-memes?sort=age&locale=de-DE");
    expect(
      getTheMemesRouteHrefWithLocale({
        href: "/the-memes?sort=age&locale=de-DE",
        locale: "en-US",
      })
    ).toBe("/the-memes?sort=age");
  });

  it("builds list and detail hrefs with locale-aware query behavior", () => {
    expect(
      getTheMemesBrowseHref({
        locale: "en-US",
        seasonId: null,
        sort: "age",
        sortDir: "asc",
      })
    ).toBe("/the-memes?sort=age&sort_dir=asc");
    expect(
      getTheMemesBrowseHref({
        locale: "de-DE",
        seasonId: 1,
        sort: "age",
        sortDir: "ASC",
      })
    ).toBe("/the-memes?sort=age&sort_dir=ASC&szn=1&locale=de-DE");
    expect(getTheMemesDetailHref({ id: 6529, locale: "en-US" })).toBe(
      "/the-memes/6529"
    );
    expect(getTheMemesDetailHref({ id: "token#1", locale: "de-DE" })).toBe(
      "/the-memes/token%231?locale=de-DE"
    );
  });
});
