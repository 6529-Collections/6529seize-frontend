import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isDevicesSecurityEnabled } from "@/components/preferences/devices-security/devicesSecurityFeature";
import {
  isProfilePreferencesEntry,
  PREFERENCES_ENTRY_SOURCE_PARAM,
} from "@/helpers/preferences-navigation";
import type { Metadata } from "next";
import PreferencesPageClient, { type PreferencesTab } from "./page.client";

export const metadata: Metadata = getAppMetadata(
  {
    title: t(DEFAULT_LOCALE, "preferences.title"),
    description: t(DEFAULT_LOCALE, "preferences.metaDescription"),
  },
  { robots: { index: false, follow: true } }
);

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
  } else if (
    (requestedTab === "security" || requestedTab === "devices") &&
    isDevicesSecurityEnabled()
  ) {
    // "devices" is the tab's former name, kept for old links.
    activeTab = "security";
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
