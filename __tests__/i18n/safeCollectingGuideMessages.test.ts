import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { getLocaleDictionary } from "@/i18n/localeDictionaries";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import safeCollecting from "@/i18n/messages/safeCollecting.en-US.json";
import tapGuide from "@/i18n/messages/delegationTapGuide.en-US.json";
import consolidation from "@/i18n/messages/networkTdhConsolidation.en-US.json";

const guideMessages = { ...safeCollecting, ...tapGuide, ...consolidation };
/** Lists interpolation tokens, preserving repetitions for parity checks. */
const placeholders = (value: string) => value.match(/\{\w+\}/g)?.sort() ?? [];

// Check the registered dictionaries, so an omitted import cannot silently
// replace a whole translated guide with the English fallback.
describe.each(SUPPORTED_LOCALES.filter((locale) => locale !== "en-US"))(
  "%s Safe Collecting guides",
  (locale) => {
    it("provides every guide message with exactly the source placeholders", () => {
      const dictionary = getLocaleDictionary(locale);
      for (const [key, source] of Object.entries(guideMessages)) {
        const translated = dictionary?.[key as MessageKey];
        expect({ key, translated }).toEqual({
          key,
          translated: expect.any(String),
        });
        expect(translated?.trim()).not.toBe("");
        expect({ key, placeholders: placeholders(translated!) }).toEqual({
          key,
          placeholders: placeholders(source),
        });
        expect(t(locale, key as MessageKey)).toBe(translated);
      }
    });
  }
);
