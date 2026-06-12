import {
  compareLocalized,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "@/i18n/format";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
} from "@/i18n/locales";
import { t } from "@/i18n/messages";

describe("frontend i18n helpers", () => {
  it("defines the initial supported locale set", () => {
    expect(DEFAULT_LOCALE).toBe("en-US");
    expect(SUPPORTED_LOCALES).toEqual([
      "en-US",
      "en-GB",
      "fr-FR",
      "es-ES",
      "de-DE",
    ]);
    expect(isSupportedLocale("en-GB")).toBe(true);
    expect(isSupportedLocale("en-us")).toBe(true);
    expect(isSupportedLocale("en-UK")).toBe(false);
    expect(normalizeLocale("en-us")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("DE-de")).toBe("de-DE");
    expect(normalizeLocale("en-UK")).toBe(DEFAULT_LOCALE);
  });

  it("translates known keys and falls back to en-US for missing locale keys", () => {
    expect(t("es-ES", "theMemes.sorting.sortBy")).toBe("Ordenar por");
    expect(
      t("fr-FR", "theMemes.card.linkAriaLabel", {
        name: "Meme",
        tokenId: "1",
      })
    ).toBe("Voir Meme, carte n° 1");
    expect(t("de-DE", "theMemes.documentTitle")).toBe("The Memes | Sammlungen");
    expect(t("en-GB", "theMemes.sorting.sortBy")).toBe("Sort by");
    expect(t("fr-FR", "theMemes.detail.tabs.collectors")).toBe("Collectors");
    expect(t("es-ES", "theMemes.detail.heading.card", { tokenId: 1 })).toBe(
      "Card 1"
    );
    expect(
      t("en-US", "memeLab.card.linkAriaLabel", {
        name: "Meme Lab NFT",
        tokenId: 1,
      })
    ).toBe("View Meme Lab NFT, Meme Lab card #1");
    expect(t("de-DE", "memeLab.sorting.sortBy")).toBe("Sort by");
    expect(
      t("en-US", "rememes.card.linkAriaLabel", {
        name: "ReMeme",
        tokenId: 1,
      })
    ).toBe("View ReMeme, ReMeme #1");
    expect(t("de-DE", "rememes.refresh.ariaLabel")).toBe(
      "Refresh ReMemes results"
    );
    expect(
      t("de-DE", "rememes.detail.documentTitle", {
        name: "Meme",
      })
    ).toBe("Meme | ReMemes");
  });

  it("formats locale-sensitive values through Intl helpers", () => {
    expect(formatNumber("de-DE", 1234.5, { maximumFractionDigits: 1 })).toBe(
      "1.234,5"
    );
    expect(formatDate("en-GB", new Date("2024-01-02T00:00:00.000Z"))).toBe(
      "2 Jan 2024"
    );
    expect(formatRelativeTime("en-US", -1, "day")).toBe("yesterday");
    expect(compareLocalized("en-US", "2", "10")).toBeLessThan(0);
  });
});
