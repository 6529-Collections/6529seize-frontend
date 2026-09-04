"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import ContentPreferencesSettings from "@/components/preferences/ContentPreferencesSettings";
import ReportsPreferencesSettings from "@/components/preferences/ReportsPreferencesSettings";
import UserSetUpProfileCta from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import {
  getPreferencesHref,
  type PreferencesRouteTab,
} from "@/helpers/preferences-navigation";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export type PreferencesTab = "notifications" | "blocked-profiles" | "reports";

const TABS: ReadonlyArray<{
  readonly id: PreferencesTab;
  readonly routeTab: PreferencesRouteTab | undefined;
  readonly labelKey:
    | "preferences.tabs.notifications"
    | "preferences.tabs.blockedProfiles"
    | "preferences.tabs.reports";
}> = [
  {
    id: "notifications",
    routeTab: undefined,
    labelKey: "preferences.tabs.notifications",
  },
  {
    id: "blocked-profiles",
    routeTab: "blocked-profiles",
    labelKey: "preferences.tabs.blockedProfiles",
  },
  {
    id: "reports",
    routeTab: "reports",
    labelKey: "preferences.tabs.reports",
  },
];

export default function PreferencesPageClient({
  activeTab,
  returnToProfile = false,
}: {
  readonly activeTab: PreferencesTab;
  readonly returnToProfile?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const { connectedProfile, fetchingProfile } = useAuth();
  const { connectionState, hasValidWalletAuth } = useSeizeConnectContext();
  const isLoadingProfile =
    fetchingProfile ||
    connectionState === "initializing" ||
    connectionState === "connecting";
  const needsProfile =
    !isLoadingProfile &&
    hasValidWalletAuth === true &&
    !connectedProfile?.handle;
  const canManagePreferences = Boolean(connectedProfile?.handle);
  const profileHref = connectedProfile?.handle
    ? `/${encodeURIComponent(connectedProfile.handle)}`
    : null;

  return (
    <main className="tailwind-scope tw-min-h-dvh tw-w-full tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-black tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12">
      <div className="tw-mx-auto tw-w-full tw-max-w-5xl">
        <div>
          {!isCapacitor && returnToProfile && profileHref && (
            <Link
              href={profileHref}
              className="tw-group -tw-ml-2 tw-mb-4 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-50"
            >
              <ArrowLeftIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-shrink-0 tw-transition-transform desktop-hover:group-hover:-tw-translate-x-0.5"
              />
              <span>{t(locale, "preferences.backToProfile")}</span>
            </Link>
          )}
          <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
            {t(locale, "preferences.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
            {t(locale, "preferences.description")}
          </p>
        </div>

        <nav
          aria-label={t(locale, "preferences.tabs.ariaLabel")}
          className="tw-mt-8 tw-flex tw-gap-x-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 lg:tw-gap-x-4"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={getPreferencesHref({
                  tab: tab.routeTab,
                  fromProfile: returnToProfile,
                })}
                aria-current={isActive ? "page" : undefined}
                className={`-tw-mb-px tw-flex tw-min-h-10 tw-items-center tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-px-1 tw-py-4 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none ${
                  isActive
                    ? "tw-border-primary-400 tw-text-iron-50"
                    : "tw-border-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-100"
                }`}
              >
                {t(locale, tab.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="tw-mt-6">
          {isLoadingProfile && (
            <output
              aria-label={t(locale, "profilePreferences.loading")}
              className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
            >
              <span className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
            </output>
          )}
          {needsProfile && (
            <section className="tw-flex tw-flex-col tw-items-center tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-6 tw-text-center">
              <p className="tw-m-0 tw-text-sm tw-text-iron-400">
                {t(locale, "preferences.createProfile")}
              </p>
              <UserSetUpProfileCta className="tw-mt-4" />
            </section>
          )}
          {!isLoadingProfile && !needsProfile && !canManagePreferences && (
            <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-6">
              <p className="tw-m-0 tw-text-center tw-text-sm tw-text-iron-400">
                {t(locale, "preferences.signIn")}
              </p>
            </section>
          )}
          {canManagePreferences && activeTab === "blocked-profiles" ? (
            <ContentPreferencesSettings
              key={connectedProfile?.id ?? "signed-out"}
            />
          ) : null}
          {canManagePreferences && activeTab === "reports" ? (
            <ReportsPreferencesSettings
              key={connectedProfile?.id ?? "signed-out"}
            />
          ) : null}
          {canManagePreferences && activeTab === "notifications" ? (
            <ProfilePreferencesSettings
              key={connectedProfile?.id ?? "signed-out"}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
