import type { Metadata } from "next";

import AiUsePage from "@/components/ai-page/use/AiUsePage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";

export default function AiUseRoute() {
  return <AiUsePage />;
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.use.title",
  "ai.meta.use.description"
);
