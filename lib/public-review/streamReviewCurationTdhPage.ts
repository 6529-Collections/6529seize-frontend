import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const EXPECTED_CURATION_TDH_EDITORIAL_SHA256 =
  "5d183d4a46fb4f8b3b341c622a15a7334e87d93bc4546a195f4536f72e032f2e";
const TRANSFORMATION_ERROR =
  "The current Stream review editorial transformation is out of date: curation and TDH authorization.";

type CurationTdhSource = {
  readonly commit: string;
  readonly repository: string;
};

function verifyEditorialSnapshot(editorialMarkdown: string): void {
  const digest = createHash("sha256")
    .update(editorialMarkdown, "utf8")
    .digest("hex");
  if (digest !== EXPECTED_CURATION_TDH_EDITORIAL_SHA256) {
    throw new Error(TRANSFORMATION_ERROR);
  }
}

export function getCurrentCurationTdhEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: CurationTdhSource;
}): string {
  verifyEditorialSnapshot(editorialMarkdown);
  return t(
    locale,
    "publicReview.pages.curationAndTdhAuthorization.currentEditorial",
    {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }
  );
}
