import { getAppMetadata } from "@/components/providers/metadata";

import MetricsPageClient from "./page.client";

import type { Metadata } from "next";

export default function MetricsPage() {
  return <MetricsPageClient />;
}

export function generateMetadata(): Metadata {
  return getAppMetadata({ title: "Health", description: "Health dashboard" });
}
