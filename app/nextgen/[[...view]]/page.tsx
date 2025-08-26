import NextGenPageClient from "./NextGenPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { getNextGenView } from "./view-utils";

export async function generateMetadata({ params }: { params: { view?: string[] } }): Promise<Metadata> {
  const nextgenView = getNextGenView(params.view?.[0] ?? "");
  return getAppMetadata({ title: "NextGen " + (nextgenView ?? "") });
}

export default function NextGenPage() {
  return <NextGenPageClient />;
}
