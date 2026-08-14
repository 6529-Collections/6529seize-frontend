import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getRequiredEditorialMatch,
  replaceRequiredEditorialMarkdown,
} from "@/lib/public-review/editorialReplacement";

const TOKENS_MINTING_OLD_INTRO = `A Stream token carries a larger set of facts: its collection, its serial within
that collection, the collection's maximum supply, the distribution policy that
admitted the mint, the limits consumed, and the history preserved through a
burn or module replacement.

Minting therefore spans identity, supply, replay protection, eligibility, and
accounting. The review follows each guarantee through the contracts and the
external systems that support them.`;

const CURRENT_SECTIONS = [
  {
    name: "tokens and minting identity",
    pattern:
      /## One permanent identity surface for many collections[\s\S]*?(?=## Supply combines several counters)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentIdentitySection",
  },
  {
    name: "tokens and minting supply",
    pattern:
      /## Supply combines several counters[\s\S]*?(?=## Why mint policy lives outside the Core)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentSupplySection",
  },
  {
    name: "tokens and minting policy",
    pattern:
      /## Why mint policy lives outside the Core[\s\S]*?(?=## The two source mint lanes)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentPolicySection",
  },
  {
    name: "tokens and minting lanes",
    pattern:
      /## The two source mint lanes[\s\S]*?(?=## Phases make distribution policy inspectable)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentLanesSection",
  },
  {
    name: "tokens and minting phases",
    pattern:
      /## Phases make distribution policy inspectable[\s\S]*?(?=## Gates carry security inputs)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentPhasesSection",
  },
  {
    name: "tokens and minting gates",
    pattern:
      /## Gates carry security inputs[\s\S]*?(?=## Durable counters cover activity across transactions)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentGatesSection",
  },
  {
    name: "tokens and minting counters",
    pattern:
      /## Durable counters cover activity across transactions[\s\S]*?(?=## Editions and signed Drop quantity)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentCountersSection",
  },
  {
    name: "tokens and minting editions",
    pattern:
      /## Editions and signed Drop quantity[\s\S]*?(?=## Prepared execution keeps cross-module state atomic)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentEditionsSection",
  },
  {
    name: "tokens and minting atomic execution",
    pattern:
      /## Prepared execution keeps cross-module state atomic[\s\S]*?(?=## Replay protection needs one durable owner)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentAtomicSection",
  },
  {
    name: "tokens and minting replay",
    pattern:
      /## Replay protection needs one durable owner[\s\S]*?(?=## Every minted token receives durable identity)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentReplaySection",
  },
  {
    name: "tokens and minting identity result",
    pattern:
      /## Every minted token receives durable identity[\s\S]*?(?=## Burning preserves history)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentIdentityResultSection",
  },
  {
    name: "tokens and minting burn",
    pattern:
      /## Burning preserves history[\s\S]*?(?=## Mint closure must close every lane)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentBurnSection",
  },
  {
    name: "tokens and minting closure",
    pattern:
      /## Mint closure must close every lane[\s\S]*?(?=## Responsibilities carried by the minting system)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentClosureSection",
  },
  {
    name: "tokens and minting responsibilities",
    pattern:
      /## Responsibilities carried by the minting system[\s\S]*?(?=## What can fail)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentResponsibilitiesSection",
  },
  {
    name: "tokens and minting failures",
    pattern: /## What can fail[\s\S]*?(?=## Questions for reviewers)/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentFailuresSection",
  },
  {
    name: "tokens and minting questions",
    pattern: /## Questions for reviewers[\s\S]*$/,
    messageKey:
      "publicReview.pages.tokensCollectionsAndMinting.currentQuestionsSection",
  },
] as const;

const TOKENS_MINTING_EXPECTED_END =
  /8\. Does the final launch path remove ambiguity between the legacy and manager\s+mint lanes\?\s*$/;

type TokensMintingSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentTokensMintingEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: TokensMintingSource;
}): string {
  const sourceParams = {
    sourceCommit: source.commit,
    sourceRepository: source.repository,
  };
  getRequiredEditorialMatch(
    editorialMarkdown,
    TOKENS_MINTING_EXPECTED_END,
    "tokens and minting ending"
  );
  const withCurrentIntro = replaceRequiredEditorialMarkdown(
    editorialMarkdown,
    TOKENS_MINTING_OLD_INTRO,
    t(locale, "publicReview.pages.tokensCollectionsAndMinting.currentIntro"),
    "tokens and minting introduction"
  );
  return CURRENT_SECTIONS.reduce(
    (markdown, section) =>
      replaceRequiredEditorialMarkdown(
        markdown,
        section.pattern,
        `${t(locale, section.messageKey, sourceParams)}\n\n`,
        section.name
      ),
    withCurrentIntro
  ).trimEnd();
}
