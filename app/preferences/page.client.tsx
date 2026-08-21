"use client";

import { useAuth } from "@/components/auth/Auth";
import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import ContentPreferencesSettings from "@/components/preferences/ContentPreferencesSettings";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
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
  const activeHandle = connectedProfile?.handle ?? null;
  const activePfp = connectedProfile?.pfp
    ? resolveIpfsUrlSync(connectedProfile.pfp)
    : null;

  return (
    <main className="tailwind-scope tw-min-h-dvh tw-bg-black tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12">
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
          <div>
            <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
              {t(locale, "preferences.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              {t(locale, "preferences.description")}
            </p>
          </div>
          {activeHandle && (
            <div
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2.5 tw-py-1.5 tw-text-sm tw-text-iron-300"
              aria-label={t(locale, "preferences.activeProfile", {
                profile: `@${activeHandle}`,
              })}
            >
              <span className="tw-relative tw-size-6 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
                {activePfp ? (
                  <Image
                    src={activePfp}
                    alt=""
                    fill
                    sizes="24px"
                    className="tw-object-cover tw-grayscale"
                  />
                ) : (
                  <UserCircleIcon
                    aria-hidden="true"
                    className="tw-size-full tw-text-iron-500"
                  />
                )}
              </span>
              <span className="tw-max-w-48 tw-truncate">@{activeHandle}</span>
            </div>
          )}
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
