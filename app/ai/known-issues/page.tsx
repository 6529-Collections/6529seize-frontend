import type { Metadata } from "next";
import { connection } from "next/server";

import AiKnownIssuesPage from "@/components/ai-page/AiKnownIssuesPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
} from "@/lib/ai-page/releaseFeed";

export default async function AiKnownIssuesRoute() {
  await connection();
  const snapshot = await getAiReleaseFeedSnapshot();
  return (
    <AiKnownIssuesPage
      version={getNewestAiRelease(snapshot.releases)?.version}
    />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.knownIssues.title",
  "ai.meta.knownIssues.description"
);
