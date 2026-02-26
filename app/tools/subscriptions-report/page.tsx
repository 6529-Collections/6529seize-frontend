import { getAppMetadata } from "@/components/providers/metadata";

import SubscriptionsReportClient from "./page.client";

import type { Metadata } from "next";

export default function SubscriptionsReportPage() {
  return <SubscriptionsReportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Subscriptions Report",
    description: "Tools",
  });
}
