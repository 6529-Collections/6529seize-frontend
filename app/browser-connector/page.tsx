import type { Metadata } from "next";
import { Suspense } from "react";
import BrowserConnectorPage from "@/components/desktop/BrowserConnectorPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// Opened by 6529 Desktop in the system browser. The request travels in the
// query; the page validates it and signs nothing until the user asks.
export default function BrowserConnectorRoute() {
  return (
    <Suspense fallback={null}>
      <BrowserConnectorPage />
    </Suspense>
  );
}

export const metadata: Metadata = getAppMetadata(
  {
    title: t(DEFAULT_LOCALE, "browserConnector.title"),
    description: t(DEFAULT_LOCALE, "browserConnector.description"),
  },
  { robots: { index: false, follow: false } }
);
