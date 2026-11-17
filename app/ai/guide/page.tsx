import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import AiGuidePage from "@/components/ai-page/AiGuidePage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import {
  getAiReleaseFeedSnapshot,
  getNewestAiRelease,
} from "@/lib/ai-page/releaseFeed";
import { detectFromUserAgent } from "@/lib/validator-page/detectSystem";

export default async function AiGuideRoute() {
  await connection();
  const [snapshot, requestHeaders] = await Promise.all([
    getAiReleaseFeedSnapshot(),
    headers(),
  ]);
  return (
    <AiGuidePage
      release={getNewestAiRelease(snapshot.releases)}
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
    />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.guide.title",
  "ai.meta.guide.description"
);
