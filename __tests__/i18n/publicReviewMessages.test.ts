import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { PUBLIC_REVIEW_ARTISTS_AND_ROLES_MESSAGES } from "@/i18n/messages/public-review-artists-and-roles";
import { PUBLIC_REVIEW_ARTWORK_LIFECYCLE_MESSAGES } from "@/i18n/messages/public-review-artwork-lifecycle";
import { PUBLIC_REVIEW_COMMUNITY_MESSAGES } from "@/i18n/messages/public-review-community";
import { PUBLIC_REVIEW_CURATION_TDH_MESSAGES } from "@/i18n/messages/public-review-curation-tdh";
import { PUBLIC_REVIEW_DEVELOPMENT_MESSAGES } from "@/i18n/messages/public-review-development";
import { PUBLIC_REVIEW_GOVERNANCE_MESSAGES } from "@/i18n/messages/public-review-governance";
import { PUBLIC_REVIEW_SALES_AND_AUCTIONS_MESSAGES } from "@/i18n/messages/public-review-sales-and-auctions";
import { PUBLIC_REVIEW_FREEZING_FINALITY_MESSAGES } from "@/i18n/messages/public-review-freezing-finality";
import { PUBLIC_REVIEW_REVENUE_SPLITS_MESSAGES } from "@/i18n/messages/public-review-revenue-splits";
import { PUBLIC_REVIEW_RANDOMNESS_MESSAGES } from "@/i18n/messages/public-review-randomness";
import { PUBLIC_REVIEW_METADATA_MESSAGES } from "@/i18n/messages/public-review-metadata";
import { PUBLIC_REVIEW_MESSAGES } from "@/i18n/messages/public-review";
import { PUBLIC_REVIEW_TOKENS_MINTING_MESSAGES } from "@/i18n/messages/public-review-tokens-minting";

const SPLIT_PUBLIC_REVIEW_MESSAGES = [
  PUBLIC_REVIEW_ARTISTS_AND_ROLES_MESSAGES,
  PUBLIC_REVIEW_ARTWORK_LIFECYCLE_MESSAGES,
  PUBLIC_REVIEW_COMMUNITY_MESSAGES,
  PUBLIC_REVIEW_CURATION_TDH_MESSAGES,
  PUBLIC_REVIEW_DEVELOPMENT_MESSAGES,
  PUBLIC_REVIEW_TOKENS_MINTING_MESSAGES,
  PUBLIC_REVIEW_GOVERNANCE_MESSAGES,
  PUBLIC_REVIEW_SALES_AND_AUCTIONS_MESSAGES,
  PUBLIC_REVIEW_FREEZING_FINALITY_MESSAGES,
  PUBLIC_REVIEW_REVENUE_SPLITS_MESSAGES,
  PUBLIC_REVIEW_RANDOMNESS_MESSAGES,
  PUBLIC_REVIEW_METADATA_MESSAGES,
] as const;

describe("split public-review messages", () => {
  it("keeps every extracted key unique and merged into the source dictionary", () => {
    const splitEntries = SPLIT_PUBLIC_REVIEW_MESSAGES.flatMap((messages) =>
      Object.entries(messages)
    );
    const splitKeys = splitEntries.map(([key]) => key);

    expect(new Set(splitKeys).size).toBe(splitKeys.length);
    for (const [key, value] of splitEntries) {
      expect(
        PUBLIC_REVIEW_MESSAGES[key as keyof typeof PUBLIC_REVIEW_MESSAGES]
      ).toBe(value);
    }
  });

  it("falls back consistently for representative current-page messages", () => {
    const representativeKeys = [
      "publicReview.forArtistsGuide.artwork.heading",
      "publicReview.pages.artworkLifecycle.currentSummary",
      "publicReview.pages.freezingPreservationAndArtworkFinality.currentSummary",
      "publicReview.rolesGuide.status.heading",
      "publicReview.development.heading",
      "publicReview.pages.randomness.currentSummary",
      "publicReview.community.editorial.heading",
      "publicReview.pages.curationAndTdhAuthorization.currentTitle",
      "publicReview.pages.curationAndTdhAuthorization.currentSummary",
      "publicReview.pages.tokensCollectionsAndMinting.currentSummary",
      "publicReview.pages.changesEmergenciesAndFutureContracts.currentEditorial",
      "publicReview.pages.fixedPriceSalesAndAuctions.currentSummary",
      "publicReview.pages.revenueSplitsAndRoyalties.currentSummary",
      "publicReview.pages.metadataScriptsAndDependencies.currentEditorial",
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of representativeKeys) {
        expect(t(locale, key)).toBe(t("en-US", key));
      }
    }
  });
});
