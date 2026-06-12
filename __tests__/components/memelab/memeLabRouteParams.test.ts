import {
  getMemeLabCollectionName,
  getMemeLabCollectionPath,
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
});
