import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getRequiredEditorialMatch,
  replaceRequiredEditorialMarkdown,
} from "@/lib/public-review/editorialReplacement";

const ARTWORK_LIFECYCLE_OLD_INTRO = `A Stream artwork moves through a sequence of deliberate commitments. Collection
identity comes first. Artwork materials, distribution, payment, randomness, and
metadata are then assembled around it. Supply and Core configuration can later
be closed, preservation evidence can accumulate, and a final ceremony can make
the remaining artwork state terminal.

That sequence is a major part of the design. “Minted,” “sold,” “frozen,”
“preserved,” and “final” describe different facts. Keeping them separate makes
each commitment visible and reviewable.

This page follows one collection through the lifecycle and explains what each
stage protects.`;

const CURRENT_SECTIONS = [
  {
    name: "artwork identity",
    pattern:
      /## 1\. The collection receives a permanent identity[\s\S]*?(?=## 2\.)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentIdentitySection",
  },
  {
    name: "artwork package",
    pattern: /## 2\. The artwork package is assembled[\s\S]*?(?=## 3\.)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentArtworkPackageSection",
  },
  {
    name: "artist approval",
    pattern:
      /## 3\. The artist can approve a specific state[\s\S]*?(?=## 4\.)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentArtistApprovalSection",
  },
  {
    name: "distribution",
    pattern:
      /## 4\. A distribution policy is selected[\s\S]*?(?=## 5\.|$)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentDistributionSection",
  },
  {
    name: "curation",
    pattern:
      /## 5\. Curation becomes a bound authorization[\s\S]*?(?=## 6\.|$)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentCurationSection",
  },
  {
    name: "mint execution",
    pattern:
      /## 6\. The selected mint lane executes atomically[\s\S]*?(?=## 7\.|$)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentMintExecutionSection",
  },
  {
    name: "token identity",
    pattern:
      /## 7\. The token receives a permanent identity[\s\S]*?(?=## 8\.|$)/,
    messageKey:
      "publicReview.pages.artworkLifecycle.currentTokenIdentitySection",
  },
] as const;

const ARTWORK_LIFECYCLE_REMAINING_SECTIONS =
  /## 8\. Randomness enters a recorded lifecycle[\s\S]*$/;
const ARTWORK_LIFECYCLE_EXPECTED_END =
  /7\. What invariants must hold before a successor module becomes current\?\s*$/;

type ArtworkLifecycleSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentArtworkLifecycleEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: ArtworkLifecycleSource;
}): string {
  const sourceParams = {
    sourceCommit: source.commit,
    sourceRepository: source.repository,
  };
  getRequiredEditorialMatch(
    editorialMarkdown,
    ARTWORK_LIFECYCLE_EXPECTED_END,
    "artwork lifecycle ending"
  );
  const withCurrentIntro = replaceRequiredEditorialMarkdown(
    editorialMarkdown,
    ARTWORK_LIFECYCLE_OLD_INTRO,
    t(locale, "publicReview.pages.artworkLifecycle.currentIntro"),
    "artwork lifecycle introduction"
  );
  const withCurrentSections = CURRENT_SECTIONS.reduce(
    (markdown, section) =>
      replaceRequiredEditorialMarkdown(
        markdown,
        section.pattern,
        `${t(locale, section.messageKey, sourceParams)}\n\n`,
        section.name
      ),
    withCurrentIntro
  );
  return replaceRequiredEditorialMarkdown(
    withCurrentSections,
    ARTWORK_LIFECYCLE_REMAINING_SECTIONS,
    t(locale, "publicReview.pages.artworkLifecycle.currentRemainingSections"),
    "artwork lifecycle remaining sections"
  );
}
