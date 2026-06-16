import {
  getInitialRememesMemeId,
  getRememeDetailHref,
  getRememesAddHref,
  getRememesBrowseQuery,
  getRouteHrefWithLocale,
  getRememesRouteLocale,
  getSearchParamValue,
  shouldNormalizeRememesMemeId,
} from "@/components/rememes/rememesRouteParams";

describe("Rememes route params", () => {
  it("normalizes search param values and locale", () => {
    expect(getSearchParamValue(["de-DE", "en-US"])).toBe("de-DE");
    expect(getSearchParamValue(undefined)).toBeNull();
    expect(getRememesRouteLocale({ locale: "DE-de" })).toBe("de-DE");
    expect(getRememesRouteLocale({ locale: "en-UK" })).toBe("en-US");
  });

  it("parses the initial meme id with explicit decimal parseInt behavior", () => {
    expect(getInitialRememesMemeId({ meme_id: "42" })).toBe(42);
    expect(getInitialRememesMemeId({ meme_id: "42abc" })).toBe(42);
    expect(getInitialRememesMemeId({ meme_id: "0x10" })).toBe(0);
    expect(getInitialRememesMemeId({ meme_id: "abc" })).toBe(0);
    expect(getInitialRememesMemeId({ meme_id: undefined })).toBe(0);
  });

  it("detects invalid meme id query values that should be normalized away", () => {
    expect(shouldNormalizeRememesMemeId({ meme_id: undefined })).toBe(false);
    expect(shouldNormalizeRememesMemeId({ meme_id: "42" })).toBe(false);
    expect(shouldNormalizeRememesMemeId({ meme_id: "0x10" })).toBe(false);
    expect(shouldNormalizeRememesMemeId({ meme_id: "" })).toBe(true);
    expect(shouldNormalizeRememesMemeId({ meme_id: "abc" })).toBe(true);
  });

  it("builds browse queries that preserve non-default locales", () => {
    expect(getRememesBrowseQuery({ locale: "en-US", memeId: 0 })).toBe("");
    expect(getRememesBrowseQuery({ locale: "de-DE", memeId: 0 })).toBe(
      "locale=de-DE"
    );
    expect(getRememesBrowseQuery({ locale: "de-DE", memeId: 42 })).toBe(
      "meme_id=42&locale=de-DE"
    );
    expect(
      getRememesBrowseQuery({
        locale: "de-DE",
        memeId: 42,
        searchParams: {
          locale: "en-US",
          meme_id: "7",
          utm_source: "newsletter",
          tag: ["one", "two"],
        },
      })
    ).toBe("utm_source=newsletter&tag=one&tag=two&meme_id=42&locale=de-DE");
  });

  it("builds locale-preserving detail hrefs", () => {
    expect(getRouteHrefWithLocale({ href: "/rememes", locale: "en-US" })).toBe(
      "/rememes"
    );
    expect(
      getRouteHrefWithLocale({ href: "/rememes?page=2", locale: "de-DE" })
    ).toBe("/rememes?page=2&locale=de-DE");
    expect(
      getRememeDetailHref({ contract: "0xabc", id: 1, locale: "de-DE" })
    ).toBe("/rememes/0xabc/1?locale=de-DE");
    expect(getRememesAddHref({ locale: "en-US" })).toBe("/rememes/add");
    expect(getRememesAddHref({ locale: "de-DE" })).toBe(
      "/rememes/add?locale=de-DE"
    );
    expect(
      getRememeDetailHref({
        contract: "collection/alpha",
        id: "token#1",
        locale: "de-DE",
      })
    ).toBe("/rememes/collection%2Falpha/token%231?locale=de-DE");
  });
});
