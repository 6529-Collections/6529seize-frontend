import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SendDiagnosticsPage from "@/components/diagnostics/SendDiagnosticsPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = getAppMetadata(
  {
    title: t(DEFAULT_LOCALE, "diagnostics.metadata.title"),
    description: t(DEFAULT_LOCALE, "diagnostics.metadata.description"),
  },
  { canonicalPath: "/about/diagnostics" }
);

export default function SendDiagnosticsRoute() {
  if (publicEnv.NEXT_PUBLIC_FEATURE_DIAGNOSTICS !== "true") notFound();
  return <SendDiagnosticsPage />;
}
