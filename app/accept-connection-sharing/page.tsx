import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import { Suspense } from "react";
import AcceptConnectionSharingPageClient from "./page.client";

export default function AcceptConnectionSharingPage() {
  return (
    <Suspense fallback={null}>
      <AcceptConnectionSharingPageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  // Connection links carry one-time credentials, so keep them out of indexes.
  return getAppMetadata(
    { title: t(DEFAULT_LOCALE, "acceptConnection.title") },
    { robots: { index: false, follow: false } }
  );
}
