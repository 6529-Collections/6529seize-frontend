import type { Metadata } from "next";

import AiKnownIssuesPage from "@/components/ai-page/AiKnownIssuesPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";

export default function AiKnownIssuesRoute() {
  return <AiKnownIssuesPage />;
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.knownIssues.title",
  "ai.meta.knownIssues.description"
);
