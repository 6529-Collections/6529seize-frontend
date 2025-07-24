import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import ConsolidationMappingToolPageClient from "./page.client";

export default function ConsolidationMappingToolPage() {
  return <ConsolidationMappingToolPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Consolidation Mapping Tool",
    description: "Tools",
  });
}
