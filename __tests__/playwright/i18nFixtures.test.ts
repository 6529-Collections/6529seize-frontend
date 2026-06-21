import {
  getLocaleStressPaths,
  LONG_TEXT_STRESS_LOCALE,
  withLocale,
} from "../../tests/support/i18nFixtures";

describe("Playwright i18n fixtures", () => {
  it("adds non-default locales while omitting the default locale", () => {
    expect(withLocale("/the-memes?sort=age", "de-DE")).toBe(
      "/the-memes?sort=age&locale=de-DE"
    );
    expect(withLocale("/the-memes?sort=age&locale=fr-FR", "en-US")).toBe(
      "/the-memes?sort=age"
    );
  });

  it("builds locale stress paths from supported locales", () => {
    const paths = getLocaleStressPaths(["/the-memes"]);

    expect(paths).toContainEqual({
      locale: LONG_TEXT_STRESS_LOCALE,
      path: "/the-memes?locale=de-DE",
    });
    expect(paths).toContainEqual({
      locale: "en-US",
      path: "/the-memes",
    });
  });
});
