import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import AiDownloadPage from "@/components/ai-page/AiDownloadPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";
import { getAiReleaseFeedSnapshot } from "@/lib/ai-page/releaseFeed";
import { detectFromUserAgent } from "@/lib/validator-page/detectSystem";

export default async function AiRoute() {
  await connection();
  const [snapshot, requestHeaders] = await Promise.all([
    getAiReleaseFeedSnapshot(),
    headers(),
  ]);
  return (
    <AiDownloadPage
      snapshot={snapshot}
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
    />
  );
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.download.title",
  "ai.meta.download.description"
);
