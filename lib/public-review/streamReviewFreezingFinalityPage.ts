import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const EXPECTED_EDITORIAL_SHA256 =
  "1e115412052ecdbfab153891c3a2721277150d234a5a542568b19f8e040b7a05";
const TRANSFORMATION_ERROR =
  "The current Stream review editorial transformation is out of date: freezing, preservation, and artwork finality.";

type FreezingFinalitySource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentFreezingFinalityEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: FreezingFinalitySource;
}): string {
  const editorialSha256 = createHash("sha256")
    .update(editorialMarkdown, "utf8")
    .digest("hex");
  if (editorialSha256 !== EXPECTED_EDITORIAL_SHA256) {
    throw new Error(TRANSFORMATION_ERROR);
  }

  return t(
    locale,
    "publicReview.pages.freezingPreservationAndArtworkFinality.currentEditorial",
    {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }
  );
}
