import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import MonitoringPageClient from "./page.client";

export const metadata: Metadata = getAppMetadata(
  {
    title: t(DEFAULT_LOCALE, "monitoring.title"),
    description: t(DEFAULT_LOCALE, "monitoring.description"),
  },
  { robots: { index: false, follow: false, nocache: true } }
);

export default function MonitoringPage() {
  return <MonitoringPageClient />;
}
