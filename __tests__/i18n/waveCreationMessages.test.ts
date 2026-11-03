import { t } from "@/i18n/messages";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

describe("wave creation message fallback", () => {
  it.each(SUPPORTED_LOCALES)(
    "provides visible and accessible Quick Chat copy in %s",
    (locale) => {
      expect(t(locale, "waves.create.quick.firstPost")).toBe("First post");
      expect(t(locale, "waves.create.quick.firstPostRequired")).toBe(
        "Write a first post or add media before continuing."
      );
      expect(t(locale, "waves.create.quick.publicCreatorAdmin")).toContain(
        "You are the administrator."
      );
    }
  );
});
