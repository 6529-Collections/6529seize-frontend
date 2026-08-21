"use client";

import { useAuth } from "@/components/auth/Auth";
import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import ContentPreferencesSettings from "@/components/preferences/ContentPreferencesSettings";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";

export type PreferencesTab = "notifications" | "content";

const TABS: ReadonlyArray<{
  readonly id: PreferencesTab;
  readonly href: string;
  readonly labelKey:
    | "preferences.tabs.notifications"
    | "preferences.tabs.content";
}> = [
  {
    id: "notifications",
    href: "/preferences",
    labelKey: "preferences.tabs.notifications",
  },
  {
    id: "content",
    href: "/preferences?tab=content",
    labelKey: "preferences.tabs.content",
  },
];

export default function PreferencesPageClient({
  activeTab,
}: {
  readonly activeTab: PreferencesTab;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();

  return (
    <main className="tailwind-scope tw-min-h-dvh tw-bg-black tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12">
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
        <div>
          <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
            {t(locale, "preferences.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
            {t(locale, "preferences.description")}
          </p>
        </div>

        <nav
          aria-label={t(locale, "preferences.tabs.ariaLabel")}
          className="tw-mt-8 tw-flex tw-gap-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`tw-relative tw-px-3 tw-pb-3 tw-pt-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors focus-visible:tw-rounded focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                  isActive
                    ? "tw-text-iron-50 after:tw-absolute after:tw-inset-x-0 after:-tw-bottom-px after:tw-h-0.5 after:tw-bg-primary-400"
                    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-100"
                }`}
              >
                {t(locale, tab.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="tw-mt-6">
          {activeTab === "content" ? (
            <ContentPreferencesSettings
              key={connectedProfile?.id ?? "signed-out"}
            />
          ) : (
            <ProfilePreferencesSettings
              key={connectedProfile?.id ?? "signed-out"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
