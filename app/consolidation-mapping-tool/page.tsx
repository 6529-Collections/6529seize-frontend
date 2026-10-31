import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import ConsolidationMappingToolPageClient from "./page.client";

export default function ConsolidationMappingToolPage() {
  return <ConsolidationMappingToolPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Consolidation Mapping Tool | Tools",
    description: t(
      DEFAULT_LOCALE,
      "pageMetadata.consolidationMappingTool.description"
    ),
  });
}
