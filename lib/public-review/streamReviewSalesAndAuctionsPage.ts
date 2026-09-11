import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const EXPECTED_EDITORIAL_SHA256 =
  "fc636691b34e4e45e49d0015400d27539c81c1bd27570766411d4a488782d4b4";
const TRANSFORMATION_ERROR =
  "The current Stream review editorial transformation is out of date";

type SalesAndAuctionsSource = {
  readonly commit: string;
  readonly repository: string;
};

function assertExpectedSalesAndAuctionsEditorial(
  editorialMarkdown: string
): void {
  const digest = createHash("sha256").update(editorialMarkdown).digest("hex");
  if (digest !== EXPECTED_EDITORIAL_SHA256) {
    throw new Error(`${TRANSFORMATION_ERROR}: fixed-price sales and auctions.`);
  }
}

export function getCurrentSalesAndAuctionsEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: SalesAndAuctionsSource;
}): string {
  assertExpectedSalesAndAuctionsEditorial(editorialMarkdown);
  return [
    "# Fixed-price sales and auctions",
    "",
    t(
      locale,
      "publicReview.pages.fixedPriceSalesAndAuctions.currentEditorial",
      {
        sourceCommit: source.commit,
        sourceRepository: source.repository,
      }
    ),
  ].join("\n");
}
