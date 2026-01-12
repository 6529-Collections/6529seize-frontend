import MetricsPageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function MetricsPage() {
  return <MetricsPageClient />;
}

export function generateMetadata(): Metadata {
  return getAppMetadata({ title: "Metrics", description: "Metrics dashboard" });
}
