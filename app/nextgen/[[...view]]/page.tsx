import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import NextGenPageClient from "./NextGenPageClient";
import { getNextGenView } from "./view-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}): Promise<Metadata> {
  const { view } = await params;
  const nextgenView = getNextGenView(view?.[0] ?? "");
  return getAppMetadata({ title: "NextGen " + (nextgenView ?? "") });
}

export default function NextGenPage() {
  return <NextGenPageClient />;
}
