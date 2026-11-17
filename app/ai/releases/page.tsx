import type { Metadata } from "next";
import { connection } from "next/server";

import AiReleasesPage from "@/components/ai-page/AiReleasesPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import { getAiReleaseFeedSnapshot } from "@/lib/ai-page/releaseFeed";

export default async function AiReleasesRoute() {
  await connection();
  return <AiReleasesPage snapshot={await getAiReleaseFeedSnapshot()} />;
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.releases.title",
  "ai.meta.releases.description"
);
