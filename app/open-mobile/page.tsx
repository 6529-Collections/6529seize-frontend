import OpenMobilePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import { Suspense } from "react";

function OpenMobileFallback() {
  const statusText = t(DEFAULT_LOCALE, "openMobile.openingStatus");

  return (
    <div
      role="status"
      aria-live="polite"
      className="tailwind-scope tw-flex tw-h-screen tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-text-center"
    >
      <p className="tw-text-2xl tw-font-bold">{statusText}</p>
    </div>
  );
}

export default function OpenMobilePage() {
  return (
    <Suspense fallback={<OpenMobileFallback />}>
      <OpenMobilePageClient />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Open Mobile" });
}
