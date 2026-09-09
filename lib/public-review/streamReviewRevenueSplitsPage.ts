import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getRequiredEditorialMatch } from "@/lib/public-review/editorialReplacement";

const REVENUE_EDITORIAL_TITLE = /^# Revenue, splits, and royalties$/m;
const REVENUE_EDITORIAL_SOURCE_COMMIT =
  /^513bd7e079eafe109df6ae1ae21bfbca6fec6786$/;
const REVENUE_EDITORIAL_EXPECTED_END =
  /9\. Does every public royalty statement describe marketplace payment under\s+ERC-2981 as voluntary\?\s*$/;
const REVENUE_EDITORIAL_SECTIONS = [
  ["accountable value path", /^## One wei should have one accountable path$/m],
  [
    "current native sale paths",
    /^## The current native-sale paths keep local accounting$/m,
  ],
  [
    "pull credits",
    /^## Pull credits keep one recipient from blocking everyone$/m,
  ],
  [
    "settlement identity",
    /^## The settlement foundation gives a sale one replay-safe identity$/m,
  ],
  [
    "revenue resolution",
    /^## Resolution separates policy from the sale mechanic$/m,
  ],
  [
    "split profiles",
    /^## Immutable split profiles make collaboration inspectable$/m,
  ],
  [
    "native ETH accounting",
    /^## Native ETH accounting must distinguish liabilities from surplus$/m,
  ],
  [
    "ERC-20 accounting",
    /^## Approved ERC-20 transfers require balance checks$/m,
  ],
  [
    "payer-bound token sales",
    /^## Payer-bound token sales remain a proposal$/m,
  ],
  ["rounding", /^## Rounding is an allocation decision$/m],
  [
    "curator rewards",
    /^## Curator rewards connect onchain claims to offchain allocation$/m,
  ],
  ["ERC-2981", /^## ERC-2981 publishes royalty information$/m],
  [
    "value reconstruction",
    /^## Every value movement should be reconstructable$/m,
  ],
  [
    "payment responsibilities",
    /^## Responsibilities carried by payment accounting$/m,
  ],
  ["failure cases", /^## What can fail$/m],
  ["reviewer questions", /^## Questions for reviewers$/m],
] as const;

type RevenueSplitsSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentRevenueSplitsEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: RevenueSplitsSource;
}): string {
  getRequiredEditorialMatch(
    source.commit,
    REVENUE_EDITORIAL_SOURCE_COMMIT,
    "revenue, splits, and royalties source commit"
  );
  const title = getRequiredEditorialMatch(
    editorialMarkdown,
    REVENUE_EDITORIAL_TITLE,
    "revenue, splits, and royalties title"
  )[0];
  getRequiredEditorialMatch(
    editorialMarkdown,
    REVENUE_EDITORIAL_EXPECTED_END,
    "revenue, splits, and royalties ending"
  );
  for (const [name, pattern] of REVENUE_EDITORIAL_SECTIONS) {
    getRequiredEditorialMatch(editorialMarkdown, pattern, name);
  }

  return `${title}\n\n${t(
    locale,
    "publicReview.pages.revenueSplitsAndRoyalties.currentEditorial",
    {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }
  )}`;
}
