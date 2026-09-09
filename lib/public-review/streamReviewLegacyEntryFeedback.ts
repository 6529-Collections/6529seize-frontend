import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewPageDefinition } from "./publicReviewTypes";
import { getStreamReviewPageHref } from "./streamReviewDefinition";

// Preserve feedback targets from the superseded current-only entry guides.
export const STREAM_REVIEW_LEGACY_ENTRY_FEEDBACK_VERSION = "2026-08-01.1";
const ARTIST_APPROVAL_SCOPE_ID = "the-scope-of-artist-approval";

export const STREAM_REVIEW_LEGACY_ENTRY_SECTIONS: Readonly<
  Record<string, readonly string[]>
> = {
  overview: [
    "what-kinds-of-art-can-it-support",
    "how-does-a-release-work",
    "what-lasts",
    "choose-what-you-want-to-understand",
    "help-shape-it",
  ],
  "for-artists": [
    "stream-artist-artwork-heading",
    "stream-artist-journey-heading",
    "stream-artist-approval-heading",
    "stream-artist-actors-heading",
    "stream-artist-sales-heading",
    "stream-artist-changes-heading",
    "stream-artist-permanence-heading",
    "stream-artist-next-step-heading",
    "stream-artist-evidence-heading",
    "stream-artist-details-heading",
    "your-collection-has-a-durable-identity",
    "approving-a-specific-collection-state",
    ARTIST_APPROVAL_SCOPE_ID,
    "statements-made-in-the-artist-s-name",
    "artwork-files-scripts-and-token-data",
    "one-of-ones-and-editions",
    "choosing-who-can-mint",
    "curation-and-tdh",
    "fixed-price-sales-and-auctions",
    "revenue-collaborators-and-royalties",
    "randomness",
    "freezing-the-work",
    "collaborators-delegation-recovery-and-estates",
    "design-position",
    "questions-for-artists",
    "decide-what-you-are-releasing",
    "know-what-your-approval-covers",
    "understand-who-gets-paid",
    "decide-what-can-change-and-what-should-become-permanent",
    "what-would-work-for-your-practice",
  ],
  "for-collectors": [
    "know-the-artwork-you-would-receive",
    "understand-the-sale",
    "know-where-your-bid-and-refund-go",
    "understand-what-can-change-after-minting",
    "consider-long-term-access",
    "what-would-you-want-answered-before-collecting",
  ],
  "review-the-code": [
    "start-with-the-actual-connections",
    "check-the-most-consequential-claims-first",
    "follow-claims-to-evidence",
    "leave-a-finding-someone-can-act-on",
  ],
};

// Archived guide headings that are absent from the immutable editorial pages.
// Their links point to the corresponding topic in the same saved snapshot.
const LEGACY_COMMENT_TARGETS: Readonly<
  Record<string, readonly (readonly [string, MessageKey, string])[]>
> = {
  overview: [
    [
      "what-kinds-of-art-can-it-support",
      "publicReview.legacyEntryFeedback.artworkFormats",
      "what-stream-is-designed-to-hold-together",
    ],
    [
      "how-does-a-release-work",
      "publicReview.legacyEntryFeedback.release",
      "from-social-decisions-to-bound-actions",
    ],
    [
      "what-lasts",
      "publicReview.legacyEntryFeedback.permanence",
      "a-permanent-center-and-evolvable-edges",
    ],
    [
      "choose-what-you-want-to-understand",
      "publicReview.legacyEntryFeedback.paths",
      "what-each-part-is-responsible-for",
    ],
    [
      "help-shape-it",
      "publicReview.legacyEntryFeedback.feedback",
      "questions-for-reviewers",
    ],
  ],
  "for-artists": [
    [
      "stream-artist-artwork-heading",
      "publicReview.forArtistsGuide.artwork.heading",
      "artwork-files-scripts-and-token-data",
    ],
    [
      "stream-artist-journey-heading",
      "publicReview.forArtistsGuide.journey.heading",
      "your-collection-has-a-durable-identity",
    ],
    [
      "stream-artist-approval-heading",
      "publicReview.forArtistsGuide.approval.heading",
      ARTIST_APPROVAL_SCOPE_ID,
    ],
    [
      "stream-artist-actors-heading",
      "publicReview.forArtistsGuide.actors.heading",
      "collaborators-delegation-recovery-and-estates",
    ],
    [
      "stream-artist-sales-heading",
      "publicReview.forArtistsGuide.sales.heading",
      "fixed-price-sales-and-auctions",
    ],
    [
      "stream-artist-changes-heading",
      "publicReview.forArtistsGuide.changes.heading",
      ARTIST_APPROVAL_SCOPE_ID,
    ],
    [
      "stream-artist-permanence-heading",
      "publicReview.forArtistsGuide.permanence.heading",
      "freezing-the-work",
    ],
    [
      "stream-artist-next-step-heading",
      "publicReview.forArtistsGuide.nextStep.heading",
      "questions-for-artists",
    ],
    [
      "stream-artist-evidence-heading",
      "publicReview.forArtistsGuide.evidence.heading",
      "design-position",
    ],
    [
      "stream-artist-details-heading",
      "publicReview.forArtistsDetails.heading",
      "your-collection-has-a-durable-identity",
    ],
    [
      "decide-what-you-are-releasing",
      "publicReview.legacyEntryFeedback.artistRelease",
      "one-of-ones-and-editions",
    ],
    [
      "know-what-your-approval-covers",
      "publicReview.legacyEntryFeedback.artistApproval",
      ARTIST_APPROVAL_SCOPE_ID,
    ],
    [
      "understand-who-gets-paid",
      "publicReview.legacyEntryFeedback.artistPayments",
      "revenue-collaborators-and-royalties",
    ],
    [
      "decide-what-can-change-and-what-should-become-permanent",
      "publicReview.legacyEntryFeedback.artistPermanence",
      "freezing-the-work",
    ],
    [
      "what-would-work-for-your-practice",
      "publicReview.legacyEntryFeedback.artistPractice",
      "questions-for-artists",
    ],
  ],
};

export function getStreamReviewLegacyCommentSections({
  page,
  version,
}: {
  readonly page: PublicReviewPageDefinition;
  readonly version: string;
}) {
  if (version !== STREAM_REVIEW_LEGACY_ENTRY_FEEDBACK_VERSION) return [];
  const pageHref = getStreamReviewPageHref({ page, version });
  return (LEGACY_COMMENT_TARGETS[page.id] ?? []).map(
    ([id, titleKey, targetId]) => ({
      id,
      title: t(DEFAULT_LOCALE, titleKey),
      href: `${pageHref}#${targetId}`,
    })
  );
}
