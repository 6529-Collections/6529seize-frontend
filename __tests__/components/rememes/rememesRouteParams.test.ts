import {
  getInitialRememesMemeId,
  getRememesBrowseQuery,
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

  it("parses the initial meme id with legacy parseInt behavior", () => {
    expect(getInitialRememesMemeId({ meme_id: "42" })).toBe(42);
    expect(getInitialRememesMemeId({ meme_id: "42abc" })).toBe(42);
    expect(getInitialRememesMemeId({ meme_id: "abc" })).toBe(0);
    expect(getInitialRememesMemeId({ meme_id: undefined })).toBe(0);
  });

  it("detects invalid meme id query values that should be normalized away", () => {
    expect(shouldNormalizeRememesMemeId({ meme_id: undefined })).toBe(false);
    expect(shouldNormalizeRememesMemeId({ meme_id: "42" })).toBe(false);
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
  });
});
