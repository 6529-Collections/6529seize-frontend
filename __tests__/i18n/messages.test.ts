import {
  compareLocalized,
  formatDate,
  formatInteger,
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

const NEW_VERSION_TOAST_LOCALE_MESSAGES = [
  {
    locale: "en-GB",
    refreshAction: "Refresh page",
    title: "A new version is available",
    eyebrow: "Yes, again!",
  },
  {
    locale: "fr-FR",
    refreshAction: "Actualiser la page",
    title: "Une nouvelle version est disponible",
    eyebrow: "Oui, encore !",
  },
  {
    locale: "es-ES",
    refreshAction: "Actualizar la página",
    title: "Hay una nueva versión disponible",
    eyebrow: "¡Sí, otra vez!",
  },
  {
    locale: "de-DE",
    refreshAction: "Seite aktualisieren",
    title: "Eine neue Version ist verfügbar",
    eyebrow: "Ja, schon wieder!",
  },
] as const;

const FILE_KIND_MESSAGE_KEYS = [
  "linkPreview.file.kind.archive",
  "linkPreview.file.kind.audio",
  "linkPreview.file.kind.binary",
  "linkPreview.file.kind.code",
  "linkPreview.file.kind.csv",
  "linkPreview.file.kind.document",
  "linkPreview.file.kind.image",
  "linkPreview.file.kind.pdf",
  "linkPreview.file.kind.presentation",
  "linkPreview.file.kind.spreadsheet",
  "linkPreview.file.kind.text",
  "linkPreview.file.kind.unknown",
  "linkPreview.file.kind.video",
] as const;

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
    expect(t("en-US", "media.video.playPreview")).toBe("Play video preview");
    expect(t("en-US", "media.video.player")).toBe("Video player");
    expect(t("en-US", "media.video.seek")).toBe("Seek video");
    expect(t("en-GB", "media.video.exitFullscreen")).toBe("Exit full screen");
    expect(t("fr-FR", "media.video.play")).toBe("Lire la video");
    expect(t("es-ES", "media.video.fullscreen")).toBe("Pantalla completa");
    expect(t("de-DE", "media.video.unsupported")).toBe(
      "Ihr Browser unterstuetzt das Video-Tag nicht."
    );
    for (const messages of NEW_VERSION_TOAST_LOCALE_MESSAGES) {
      expect(t(messages.locale, "newVersionToast.refreshAction")).toBe(
        messages.refreshAction
      );
      expect(t(messages.locale, "newVersionToast.title")).toBe(messages.title);
      expect(t(messages.locale, "newVersionToast.eyebrow")).toBe(
        messages.eyebrow
      );
    }
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
      t("fr-FR", "memeLab.results.collectionGridLabel", {
        collectionName: "6529 Intern JPGs",
      })
    ).toBe(
      t("en-US", "memeLab.results.collectionGridLabel", {
        collectionName: "6529 Intern JPGs",
      })
    );
    expect(
      t("en-US", "rememes.card.linkAriaLabel", {
        name: "ReMeme",
        tokenId: 1,
      })
    ).toBe("View ReMeme, ReMeme #1");
    expect(t("es-ES", "rememes.results.gridLabel")).toBe(
      t("en-US", "rememes.results.gridLabel")
    );
    expect(t("de-DE", "rememes.refresh.ariaLabel")).toBe(
      "Refresh ReMemes results"
    );
    expect(t("fr-FR", "user.collected.cards.listLabel")).toBe(
      t("en-US", "user.collected.cards.listLabel")
    );
    expect(t("de-DE", "user.collected.empty.noCards")).toBe(
      t("en-US", "user.collected.empty.noCards")
    );
    expect(t("fr-FR", "user.collected.filters.sortBy")).toBe(
      t("en-US", "user.collected.filters.sortBy")
    );
    expect(
      t("de-DE", "user.collected.stats.seasons.startedCount", {
        started: 2,
        total: 3,
      })
    ).toBe(
      t("en-US", "user.collected.stats.seasons.startedCount", {
        started: 2,
        total: 3,
      })
    );
    expect(t("fr-FR", "user.collected.stats.details.unavailable")).toBe(
      t("en-US", "user.collected.stats.details.unavailable")
    );
    expect(
      t("es-ES", "user.collected.stats.metrics.unique", {
        value: "465",
      })
    ).toBe(
      t("en-US", "user.collected.stats.metrics.unique", {
        value: "465",
      })
    );
    expect(t("fr-FR", "user.collected.stats.details.overview")).toBe(
      t("en-US", "user.collected.stats.details.overview")
    );
    expect(
      t("de-DE", "user.collected.stats.details.tables.overviewCaption")
    ).toBe(t("en-US", "user.collected.stats.details.tables.overviewCaption"));
    expect(
      t("es-ES", "user.collected.stats.details.seasonLabel", {
        seasonNumber: 1,
      })
    ).toBe(
      t("en-US", "user.collected.stats.details.seasonLabel", {
        seasonNumber: 1,
      })
    );
    expect(
      t("fr-FR", "user.collected.stats.details.uniqueProgress", {
        held: "1",
        total: "2",
      })
    ).toBe("1 / 2");
    expect(
      t("de-DE", "user.collected.stats.boostBreakdown.versionLink", {
        version: "1.4",
      })
    ).toBe(
      t("en-US", "user.collected.stats.boostBreakdown.versionLink", {
        version: "1.4",
      })
    );
    expect(t("fr-FR", "user.collected.stats.boostBreakdown.tableCaption")).toBe(
      t("en-US", "user.collected.stats.boostBreakdown.tableCaption")
    );
    expect(t("es-ES", "user.collected.stats.activityOverview.title")).toBe(
      t("en-US", "user.collected.stats.activityOverview.title")
    );
    expect(
      t("de-DE", "user.collected.stats.activityOverview.seasonLabel", {
        seasonNumber: 1,
      })
    ).toBe(
      t("en-US", "user.collected.stats.activityOverview.seasonLabel", {
        seasonNumber: 1,
      })
    );
    expect(t("fr-FR", "user.collected.stats.activityTabs.walletActivity")).toBe(
      t("en-US", "user.collected.stats.activityTabs.walletActivity")
    );
    expect(t("de-DE", "user.collected.stats.activityTabs.listLabel")).toBe(
      t("en-US", "user.collected.stats.activityTabs.listLabel")
    );
    expect(t("fr-FR", "user.collected.stats.walletActivity.title")).toBe(
      t("en-US", "user.collected.stats.walletActivity.title")
    );
    expect(
      t("de-DE", "user.collected.stats.walletActivity.filterButtonLabel", {
        filter: "All",
      })
    ).toBe("Wallet activity filter: All");
    expect(t("es-ES", "user.collected.stats.walletActivity.empty.mints")).toBe(
      t("en-US", "user.collected.stats.walletActivity.empty.mints")
    );
    expect(t("fr-FR", "user.collected.stats.distributions.title")).toBe(
      t("en-US", "user.collected.stats.distributions.title")
    );
    expect(
      t("de-DE", "user.collected.stats.distributions.tokenLinkAriaLabel", {
        collection: "The Memes",
        tokenId: 1,
      })
    ).toBe("View The Memes token #1");
    expect(t("fr-FR", "user.collected.stats.tdhHistory.title")).toBe(
      t("en-US", "user.collected.stats.tdhHistory.title")
    );
    expect(
      t("es-ES", "user.collected.stats.tdhHistory.chartAriaLabel", {
        title: "Total TDH",
      })
    ).toBe("Total TDH chart");
    expect(t("fr-FR", "user.profile.tabs.navigationLabel")).toBe(
      t("en-US", "user.profile.tabs.navigationLabel")
    );
    expect(t("de-DE", "user.profile.tabs.badges.beta")).toBe("Beta");
    expect(t("fr-FR", "followers.modal.title")).toBe(
      t("en-US", "followers.modal.title")
    );
    expect(
      t("de-DE", "followers.profile.linkAriaLabel", {
        handle: "alice",
      })
    ).toBe("View alice's profile");
    expect(t("es-ES", "user.collected.networkCards.empty")).toBe(
      t("en-US", "user.collected.networkCards.empty")
    );
    expect(t("de-DE", "theMemes.detail.live.market.title")).toBe(
      t("en-US", "theMemes.detail.live.market.title")
    );
    expect(
      t("fr-FR", "theMemes.detail.live.rank", {
        rank: "1",
        total: "100",
      })
    ).toBe("Rank 1/100");
    expect(t("de-DE", "theMemes.detail.activity.region")).toBe(
      t("en-US", "theMemes.detail.activity.region")
    );
    expect(
      t("es-ES", "theMemes.detail.activity.table.caption", { tokenId: 1 })
    ).toBe(
      t("en-US", "theMemes.detail.activity.table.caption", { tokenId: 1 })
    );
    expect(t("de-DE", "theMemes.detail.timeline.region")).toBe(
      t("en-US", "theMemes.detail.timeline.region")
    );
    expect(t("fr-FR", "theMemes.detail.references.rememes.description")).toBe(
      t("en-US", "theMemes.detail.references.rememes.description")
    );
    expect(
      t("es-ES", "theMemes.detail.references.sort.trigger", {
        sort: t("es-ES", "rememes.sort.random"),
      })
    ).toBe(`Sort: ${t("es-ES", "rememes.sort.random")}`);
    expect(t("fr-FR", "theMemes.detail.art.media.fullscreen")).toBe(
      t("en-US", "theMemes.detail.art.media.fullscreen")
    );
    expect(t("de-DE", "theMemes.detail.art.sections.arweaveLinks")).toBe(
      t("en-US", "theMemes.detail.art.sections.arweaveLinks")
    );
    expect(
      t("es-ES", "theMemes.detail.art.download.downloadingProgress", {
        percentage: formatInteger("es-ES", 50),
      })
    ).toBe(
      t("en-US", "theMemes.detail.art.download.downloadingProgress", {
        percentage: formatInteger("en-US", 50),
      })
    );
    expect(t("fr-FR", "timeline.links.uriAriaLabel")).toBe(
      t("en-US", "timeline.links.uriAriaLabel")
    );
    expect(t("de-DE", "memeCalendar.periods.positionLabel")).toBe(
      t("en-US", "memeCalendar.periods.positionLabel")
    );
    expect(
      t("fr-FR", "memeCalendar.periods.seasonLinkAriaLabel", {
        season: 1,
      })
    ).toBe(
      t("en-US", "memeCalendar.periods.seasonLinkAriaLabel", {
        season: 1,
      })
    );
    expect(t("es-ES", "memeCalendar.timezone.showLocal")).toBe(
      t("en-US", "memeCalendar.timezone.showLocal")
    );
    expect(
      t("de-DE", "memeCalendar.overview.upcoming.currentSeason", {
        season: 14,
      })
    ).toBe(
      t("en-US", "memeCalendar.overview.upcoming.currentSeason", {
        season: 14,
      })
    );
    expect(t("fr-FR", "memeCalendar.invites.addToCalendar")).toBe(
      t("en-US", "memeCalendar.invites.addToCalendar")
    );
    expect(t("es-ES", "memeCalendar.overview.upcoming.mintTime")).toBe(
      t("en-US", "memeCalendar.overview.upcoming.mintTime")
    );
    expect(t("de-DE", "memeCalendar.grid.previous", { division: "SZN" })).toBe(
      t("en-US", "memeCalendar.grid.previous", { division: "SZN" })
    );
    expect(
      t("fr-FR", "memeCalendar.grid.cardAriaLabel", {
        title: "SZN #14",
        range: "Jan 2026 - Mar 2026",
        mints: "Memes #123 - #456",
      })
    ).toBe(
      t("en-US", "memeCalendar.grid.cardAriaLabel", {
        title: "SZN #14",
        range: "Jan 2026 - Mar 2026",
        mints: "Memes #123 - #456",
      })
    );
    const timelineMediaParams = {
      label: t("en-US", "timeline.fields.addedImage"),
    };
    expect(t("es-ES", "timeline.media.imageAlt", timelineMediaParams)).toBe(
      t("en-US", "timeline.media.imageAlt", timelineMediaParams)
    );
    expect(
      t("de-DE", "rememes.detail.documentTitle", {
        name: "Meme",
      })
    ).toBe("Meme | ReMemes");
    expect(
      t("fr-FR", "memeLab.detail.heading.ariaLabel", {
        tokenId: 1,
        name: "Meme Lab Card",
      })
    ).toBe("Meme Lab Card 1 - Meme Lab Card");
    const distributionHeadingParams = {
      collection: "Meme Lab",
      tokenId: 1,
    };
    expect(t("de-DE", "distribution.heading", distributionHeadingParams)).toBe(
      t("en-US", "distribution.heading", distributionHeadingParams)
    );
    const distributionPhotoParams = {
      collection: "The Memes",
      tokenId: 2,
      photoNumber: 3,
    };
    expect(t("es-ES", "distribution.photos.alt", distributionPhotoParams)).toBe(
      t("en-US", "distribution.photos.alt", distributionPhotoParams)
    );
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

  it("keeps file-kind labels distinguishable within each locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const labels = FILE_KIND_MESSAGE_KEYS.map((key) =>
        t(locale, key).toLocaleLowerCase(locale)
      );
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});
