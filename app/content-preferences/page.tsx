import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import ContentPreferencesPageClient from "./page.client";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "contentModeration.preferences.metaTitle"),
  description: t(
    DEFAULT_LOCALE,
    "contentModeration.preferences.metaDescription"
  ),
});

export default function ContentPreferencesPage() {
  return <ContentPreferencesPageClient />;
}
