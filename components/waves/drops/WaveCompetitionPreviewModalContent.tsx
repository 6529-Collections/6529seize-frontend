"use client";

import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { t } from "@/i18n/messages";
import { DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { WaveCompetitionPreviewTab } from "./WaveCompetitionBadges";
import { WaveCompetitionEntries } from "./WaveCompetitionEntries";

interface WaveCompetitionPreviewModalContentProps {
  readonly user: ApiProfileMin;
  readonly wave: ApiWaveMin;
  readonly hasActiveEntries: boolean;
  readonly hasWinningEntries: boolean;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp: boolean;
  readonly activeTab: WaveCompetitionPreviewTab;
  readonly onTabChange: (tab: WaveCompetitionPreviewTab) => void;
}

const TabButton = ({
  tab,
  activeTab,
  onTabChange,
  children,
}: {
  readonly tab: WaveCompetitionPreviewTab;
  readonly activeTab: WaveCompetitionPreviewTab;
  readonly onTabChange: (tab: WaveCompetitionPreviewTab) => void;
  readonly children: React.ReactNode;
}) => {
  const isActive = activeTab === tab;
  const activeClass =
    tab === "winners"
      ? "tw-bg-emerald-500/15 tw-text-emerald-200 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "tw-bg-violet-500/15 tw-text-violet-200 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onTabChange(tab)}
      className={`tw-flex-1 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 ${
        isActive
          ? activeClass
          : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      {children}
    </button>
  );
};

export const WaveCompetitionPreviewModalContent = ({
  user,
  wave,
  hasActiveEntries,
  hasWinningEntries,
  isOpen,
  onClose,
  isApp,
  activeTab,
  onTabChange,
}: WaveCompetitionPreviewModalContentProps) => {
  const locale = useBrowserLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const compact = useCompactMode();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");
  const showTabs = hasActiveEntries && hasWinningEntries;
  const currentTab = showTabs
    ? activeTab
    : hasWinningEntries
      ? "winners"
      : "active";
  const displayName =
    user.handle?.trim() ||
    user.primary_address?.trim() ||
    t(locale, "waves.competitionBadges.profileFallback");
  const currentTabLabel = t(
    locale,
    currentTab === "active"
      ? "waves.competitionBadges.tabs.active"
      : "waves.competitionBadges.tabs.winners"
  );

  const handleDropClick = useCallback(
    (drop: ApiDrop) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("drop", drop.id);
      router.push(`${pathname}?${params.toString()}`);
      if (compact && isSmallScreen) {
        globalThis.window.dispatchEvent(
          new CustomEvent("single-drop:close-chat")
        );
      }
      onClose();
    },
    [compact, isSmallScreen, onClose, pathname, router, searchParams]
  );

  return (
    <div className="tailwind-scope tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/5 tw-bg-[#0E1012] tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-28 tw-bg-[radial-gradient(80%_100%_at_20%_0%,rgba(139,92,246,0.10),transparent_75%)]" />

      <header className="tw-relative tw-z-[100] tw-flex tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60 tw-p-6">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-4">
          <div className="tw-size-12 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-violet-400/25">
            {user.pfp && (
              <img
                src={user.pfp}
                alt=""
                className="tw-size-full tw-bg-transparent tw-object-contain"
              />
            )}
          </div>
          <div className="tw-min-w-0 tw-text-left">
            <DialogTitle className="tw-m-0 tw-truncate tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
              {t(locale, "waves.competitionBadges.title", {
                profile: displayName,
              })}
            </DialogTitle>
            <div className="tw-mt-1 tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-text-white/50">
              <span>{currentTabLabel}</span>
              <span
                className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-white/40"
                aria-hidden="true"
              />
              <span className="tw-truncate">{wave.name}</span>
            </div>
          </div>
        </div>

        {!isApp && (
          <button
            type="button"
            onClick={onClose}
            className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800/70 tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 active:tw-scale-95 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900"
            aria-label={t(locale, "waves.competitionBadges.close")}
          >
            <XMarkIcon className="tw-size-5" />
          </button>
        )}
      </header>

      {showTabs && (
        <div
          className="tw-relative tw-z-[100] tw-mt-4 tw-flex tw-w-full tw-px-6 sm:tw-w-auto"
          role="tablist"
        >
          <div className="tw-flex tw-h-10 tw-w-full tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1 sm:tw-w-auto">
            <TabButton
              tab="active"
              activeTab={activeTab}
              onTabChange={onTabChange}
            >
              {t(locale, "waves.competitionBadges.tabs.active")}
            </TabButton>
            <TabButton
              tab="winners"
              activeTab={activeTab}
              onTabChange={onTabChange}
            >
              {t(locale, "waves.competitionBadges.tabs.winners")}
            </TabButton>
          </div>
        </div>
      )}

      <WaveCompetitionEntries
        authorId={user.id}
        wave={wave}
        kind={currentTab}
        isOpen={isOpen}
        isApp={isApp}
        onDropClick={handleDropClick}
      />
    </div>
  );
};
