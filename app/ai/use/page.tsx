import type { Metadata } from "next";
import { connection } from "next/server";

import AiUsePage from "@/components/ai-page/use/AiUsePage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
} from "@/lib/ai-page/releaseFeed";

export default async function AiUseRoute() {
  await connection();
  const snapshot = await getAiReleaseFeedSnapshot();
  return <AiUsePage version={getNewestAiRelease(snapshot.releases)?.version} />;
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.use.title",
  "ai.meta.use.description"
);
