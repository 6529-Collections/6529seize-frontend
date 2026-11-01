import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorDocPage from "@/components/validator-page/ValidatorDocPage";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

export default async function ValidatorKnownIssuesRoute() {
  await connection();
  const locked = await getLockedView("/validator/known-issues");
  if (locked) {
    return locked;
  }
  return (
    <ValidatorDocPage
      section="known-issues"
      eyebrow="Known issues"
      title="Known issues in the test release"
      markdown={VALIDATOR_KNOWN_ISSUES_MARKDOWN}
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "Known issues | 6529 Validator",
  "Known issues in the 6529 validator test release, with workarounds."
);
