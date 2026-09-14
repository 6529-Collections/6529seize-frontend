import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";

it.each(SUPPORTED_LOCALES)(
  "preserves the SEIZED! confirmation title in %s",
  (locale) => {
    expect(t(locale, "theMemes.mint.transaction.success")).toBe("SEIZED!");
  }
);
