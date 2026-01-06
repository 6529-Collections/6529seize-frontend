import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import SubscriptionsReportClient from "./page.client";

export default function SubscriptionsReportPage() {
  return <SubscriptionsReportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Subscriptions Report",
    description: "Tools",
  });
}
