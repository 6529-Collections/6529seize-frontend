import type { Metadata } from "next";
import { connection } from "next/server";

import AiModelsPage from "@/components/ai-page/models/AiModelsPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
} from "@/lib/ai-page/releaseFeed";

export default async function AiModelsRoute() {
  await connection();
  const snapshot = await getAiReleaseFeedSnapshot();
  return (
    <AiModelsPage version={getNewestAiRelease(snapshot.releases)?.version} />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.models.title",
  "ai.meta.models.description"
);
