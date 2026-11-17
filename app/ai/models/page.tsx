import type { Metadata } from "next";

import AiModelsPage from "@/components/ai-page/models/AiModelsPage";
import { getAiPageMetadata } from "@/lib/ai-page/pageMetadata";

export default function AiModelsRoute() {
  return <AiModelsPage />;
}

export const metadata: Metadata = getAiPageMetadata(
  "ai.meta.models.title",
  "ai.meta.models.description"
);
