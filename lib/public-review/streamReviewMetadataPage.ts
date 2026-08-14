import "next/dist/compiled/server-only";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getRequiredEditorialMatch } from "@/lib/public-review/editorialReplacement";

const EXPECTED_METADATA_HEADINGS = [
  "The first question is: where are the bytes?",
  "Metadata modes express different preservation promises",
  "String construction is a security boundary",
  "Scripts are ordered, byte-exact artwork inputs",
  "Versioned dependencies prevent silent library replacement",
  "Collection metadata separates claims by purpose and authority",
  "Snapshots preserve an authorized view",
  "Shared contract metadata serves the ERC-721 surface",
  "Refresh events tell consumers that state changed",
  "Size limits protect delivery and execution",
  "The browser is part of the artwork's environment",
  "Every collection needs a dependency bill of materials",
  "Responsibilities carried by metadata records",
  "What can fail",
  "Questions for reviewers",
] as const;

const EXPECTED_METADATA_END =
  /9\. What must be preserved outside Ethereum for each supported artwork mode to\s+remain reproducible\?\s*$/;

function assertExpectedMetadataStructure(editorialMarkdown: string): void {
  let remainingMarkdown = editorialMarkdown;
  for (const heading of EXPECTED_METADATA_HEADINGS) {
    const headingLine = `## ${heading}`;
    const lines = remainingMarkdown.split("\n");
    const matchIndex = lines.indexOf(headingLine);
    if (matchIndex < 0) {
      throw new Error(
        "The current Stream review editorial transformation is out of date: " +
          `metadata section: ${heading}.`
      );
    }
    remainingMarkdown = lines.slice(matchIndex + 1).join("\n");
  }
  getRequiredEditorialMatch(
    editorialMarkdown,
    EXPECTED_METADATA_END,
    "metadata page ending"
  );
}

type MetadataPageSource = {
  readonly commit: string;
  readonly repository: string;
};

export function getCurrentMetadataEditorialMarkdown({
  editorialMarkdown,
  locale = DEFAULT_LOCALE,
  source,
}: {
  readonly editorialMarkdown: string;
  readonly locale?: SupportedLocale | undefined;
  readonly source: MetadataPageSource;
}): string {
  assertExpectedMetadataStructure(editorialMarkdown);
  return t(
    locale,
    "publicReview.pages.metadataScriptsAndDependencies.currentEditorial",
    {
      sourceCommit: source.commit,
      sourceRepository: source.repository,
    }
  );
}
