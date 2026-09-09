import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const GOVERNANCE_EDITORIAL_SHA256 =
  "af94fe853022db4c226d7c88b67515e77299cdb2b643707d1dafdcd044e1b391";
const TRANSFORMATION_ERROR =
  "The current Stream review editorial transformation is out of date: governance page.";

type GovernanceSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentGovernanceEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: GovernanceSource;
}): string {
  const sourceHash = createHash("sha256")
    .update(editorialMarkdown)
    .digest("hex");
  if (sourceHash !== GOVERNANCE_EDITORIAL_SHA256) {
    throw new Error(TRANSFORMATION_ERROR);
  }

  return t(
    locale,
    "publicReview.pages.changesEmergenciesAndFutureContracts.currentEditorial",
    {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }
  );
}
