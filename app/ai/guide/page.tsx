import type { Metadata } from "next";
import { connection } from "next/server";

import AiDocPage from "@/components/ai-page/AiDocPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { getAiGuideMarkdown } from "@/lib/ai-page/content/guideMarkdown";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
} from "@/lib/ai-page/releaseFeed";

export default async function AiGuideRoute() {
  await connection();
  const snapshot = await getAiReleaseFeedSnapshot();
  return (
    <AiDocPage
      section="guide"
      eyebrow={t(DEFAULT_LOCALE, "ai.guide.eyebrow")}
      title={t(DEFAULT_LOCALE, "ai.guide.title")}
      lead={t(DEFAULT_LOCALE, "ai.guide.lead")}
      markdown={getAiGuideMarkdown(getNewestAiRelease(snapshot.releases))}
    />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.guide.title",
  "ai.meta.guide.description"
);
