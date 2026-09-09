import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  isProfilePreferencesEntry,
  PREFERENCES_ENTRY_SOURCE_PARAM,
} from "@/helpers/preferences-navigation";
import type { Metadata } from "next";
import PreferencesPageClient, { type PreferencesTab } from "./page.client";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "preferences.title"),
  description: t(DEFAULT_LOCALE, "preferences.metaDescription"),
});

export default async function PreferencesPage({
  searchParams,
}: {
  readonly searchParams?: Promise<{
    readonly tab?: string | string[] | undefined;
    readonly from?: string | string[] | undefined;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedTab = resolvedSearchParams?.tab;
  let activeTab: PreferencesTab = "notifications";
  if (requestedTab === "blocked-profiles" || requestedTab === "content") {
    activeTab = "blocked-profiles";
  } else if (requestedTab === "reports") {
    activeTab = "reports";
  }
  return (
    <PreferencesPageClient
      activeTab={activeTab}
      returnToProfile={isProfilePreferencesEntry(
        resolvedSearchParams?.[PREFERENCES_ENTRY_SOURCE_PARAM]
      )}
    />
  );
}
