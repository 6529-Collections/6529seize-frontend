import type { Metadata } from "next";

import AiDocPage from "@/components/ai-page/AiDocPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { AI_KNOWN_ISSUES_MARKDOWN } from "@/lib/ai-page/content/knownIssuesMarkdown";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";

export default function AiKnownIssuesRoute() {
  return (
    <AiDocPage
      section="known-issues"
      eyebrow={t(DEFAULT_LOCALE, "ai.knownIssues.eyebrow")}
      title={t(DEFAULT_LOCALE, "ai.knownIssues.title")}
      markdown={AI_KNOWN_ISSUES_MARKDOWN}
    />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.knownIssues.title",
  "ai.meta.knownIssues.description"
);
