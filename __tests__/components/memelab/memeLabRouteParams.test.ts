import {
  getMemeLabCollectionHref,
  getMemeLabCollectionName,
  getMemeLabCollectionPath,
  getMemeLabDetailHref,
  getMemeLabRouteHrefWithLocale,
  getMemeLabRouteLocale,
  getSearchParamValue,
} from "@/components/memelab/memeLabRouteParams";

describe("Meme Lab route params", () => {
  it("normalizes search param values and locale", () => {
    expect(getSearchParamValue(["de-DE", "en-US"])).toBe("de-DE");
    expect(getSearchParamValue(undefined)).toBeNull();
    expect(getMemeLabRouteLocale({ locale: "DE-de" })).toBe("de-DE");
    expect(getMemeLabRouteLocale({ locale: "en-UK" })).toBe("en-US");
  });

  it("round trips collection names with multiple spaces", () => {
    const path = getMemeLabCollectionPath("6529  Intern   JPGs");

    expect(path).toBe("/meme-lab/collection/6529-Intern-JPGs");
    expect(getMemeLabCollectionName("6529-Intern%20%20JPGs")).toBe(
      "6529 Intern JPGs"
    );
    expect(getMemeLabCollectionName("6529-Intern%20JPGs")).toBe(
      "6529 Intern JPGs"
    );
    expect(getMemeLabCollectionName("6529-Intern-JPGs")).toBe(
      "6529 Intern JPGs"
    );
  });

  it("builds locale-preserving detail hrefs", () => {
    expect(
      getMemeLabRouteHrefWithLocale({ href: "/meme-lab", locale: "en-US" })
    ).toBe("/meme-lab");
    expect(
      getMemeLabRouteHrefWithLocale({
        href: "/meme-lab/1?focus=activity",
        locale: "de-DE",
      })
    ).toBe("/meme-lab/1?focus=activity&locale=de-DE");
    expect(
      getMemeLabRouteHrefWithLocale({
        href: "/meme-lab/1?focus=activity&locale=de-DE",
        locale: "en-US",
      })
    ).toBe("/meme-lab/1?focus=activity");
    expect(
      getMemeLabRouteHrefWithLocale({
        href: "/meme-lab/1?focus=activity&locale=fr-FR",
        locale: "de-DE",
      })
    ).toBe("/meme-lab/1?focus=activity&locale=de-DE");
    expect(getMemeLabDetailHref({ id: 1, locale: "de-DE" })).toBe(
      "/meme-lab/1?locale=de-DE"
    );
    expect(getMemeLabDetailHref({ id: "token#1", locale: "de-DE" })).toBe(
      "/meme-lab/token%231?locale=de-DE"
    );
    expect(
      getMemeLabCollectionHref({
        collectionName: "6529 Intern JPGs",
        locale: "en-US",
      })
    ).toBe("/meme-lab/collection/6529-Intern-JPGs");
    expect(
      getMemeLabCollectionHref({
        collectionName: "6529 Intern JPGs",
        locale: "de-DE",
      })
    ).toBe("/meme-lab/collection/6529-Intern-JPGs?locale=de-DE");
  });
});
