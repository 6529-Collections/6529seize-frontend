import type { Metadata } from "next";

import AppsPage from "@/components/apps/AppsPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const APPS_LOCALE = DEFAULT_LOCALE;

export const metadata: Metadata = getAppMetadata({
  title: t(APPS_LOCALE, "apps.metadata.title"),
  description: t(APPS_LOCALE, "apps.metadata.description"),
});

export default function AppsRoute() {
  return <AppsPage />;
}
