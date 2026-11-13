import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import SubscriptionsReportClient from "./page.client";

export default function SubscriptionsReportPage() {
  return <SubscriptionsReportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Subscriptions Report | Tools",
    description: t(
      DEFAULT_LOCALE,
      "pageMetadata.subscriptionsReport.description"
    ),
  });
}
