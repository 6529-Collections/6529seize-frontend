"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import WaveChip from "@/components/waves/WaveChip";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import { getSidebarWaveHref } from "./userPageBrainSidebarWave.helpers";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";

const PILL_BUTTON_CLASS =
  "tw-inline-flex tw-h-9 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-400 tw-shadow-sm tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100 motion-reduce:tw-transition-none";

const MOBILE_WAVE_ROW_CLASS =
  "tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-500";

const MOBILE_WAVE_ROW_CONTENT_CLASS =
  "tw-flex tw-w-max tw-min-w-full tw-items-center tw-gap-2 tw-px-4 tw-pb-1.5";

function UserPageBrainSidebarMobileWavePill({
  wave,
}: {
  readonly wave: ProfileWaveActivitySidebarItem;
}) {
  return (
    <WaveChip
      name={wave.name}
      picture={wave.picture}
      isPrivate={wave.isPrivate}
      href={getSidebarWaveHref(wave)}
    />
  );
}

function MobileSectionState({
  state,
  emptyMessageKey,
}: {
  readonly state: ProfileWaveActivityQueryState;
  readonly emptyMessageKey:
    | "user.brain.sidebar.createdEmpty"
    | "user.brain.sidebar.recentEmpty";
}) {
  const locale = useBrowserLocale();

  if (state.isInitialLoading) {
    return (
      <div
        aria-hidden="true"
        className="tw-h-9 tw-w-28 tw-animate-pulse tw-rounded-lg tw-bg-white/[0.06] motion-reduce:tw-animate-none"
      />
    );
  }

  if (state.isInitialError) {
    return (
      <button
        type="button"
        onClick={() => void state.refetch()}
        className={PILL_BUTTON_CLASS}
      >
        {getUserPageBrainSidebarMessage(locale, "user.brain.sidebar.retry")}
      </button>
    );
  }

  if (state.waves.length === 0) {
    return (
      <span className="tw-flex tw-h-9 tw-items-center tw-px-1 tw-text-meta/4 tw-font-normal tw-italic tw-text-iron-500">
        {getUserPageBrainSidebarMessage(locale, emptyMessageKey)}
      </span>
    );
  }

  return null;
}

interface UserPageBrainSidebarMobileStripProps {
  readonly createdState: ProfileWaveActivityQueryState;
  readonly recentState: ProfileWaveActivityQueryState;
  readonly onOpenCreatedWaves: () => void;
}

export default function UserPageBrainSidebarMobileStrip({
  createdState,
  recentState,
  onOpenCreatedWaves,
}: UserPageBrainSidebarMobileStripProps) {
  const locale = useBrowserLocale();
  const firstCreatedWave = createdState.waves[0];
  const canOpenCreatedWaves =
    createdState.waves.length > 1 || createdState.hasNextPage;
  const showCreatedSection =
    createdState.status !== "success" || createdState.waves.length > 0;

  return (
    <section
      aria-label={getUserPageBrainSidebarMessage(
        locale,
        "user.brain.sidebar.mobileStripLabel"
      )}
      className="-tw-mx-4 tw-flex tw-min-w-0 tw-flex-col tw-gap-4 sm:-tw-mx-6 md:-tw-mx-8 lg:tw-hidden"
      data-testid="brain-sidebar-mobile-strip"
    >
      {showCreatedSection && (
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
          <span className="tw-px-4 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            {getUserPageBrainSidebarMessage(
              locale,
              "user.brain.sidebar.createdMobileHeading"
            )}
          </span>
          <div
            className={MOBILE_WAVE_ROW_CLASS}
            data-testid="brain-created-waves-mobile"
          >
            <div className={MOBILE_WAVE_ROW_CONTENT_CLASS}>
              {firstCreatedWave ? (
                <UserPageBrainSidebarMobileWavePill wave={firstCreatedWave} />
              ) : (
                <MobileSectionState
                  state={createdState}
                  emptyMessageKey="user.brain.sidebar.createdEmpty"
                />
              )}
              {firstCreatedWave && canOpenCreatedWaves && (
                <button
                  type="button"
                  onClick={onOpenCreatedWaves}
                  className={PILL_BUTTON_CLASS}
                  aria-label={getUserPageBrainSidebarMessage(
                    locale,
                    "user.brain.sidebar.viewMoreCreatedWaves"
                  )}
                >
                  <PlusIcon
                    aria-hidden="true"
                    className="tw-h-3 tw-w-3 tw-flex-shrink-0"
                  />
                  <span>
                    {getUserPageBrainSidebarMessage(
                      locale,
                      "user.brain.sidebar.more"
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
        <span className="tw-px-4 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
          {getUserPageBrainSidebarMessage(
            locale,
            "user.brain.sidebar.recentlyActiveHeading"
          )}
        </span>
        <div
          className={MOBILE_WAVE_ROW_CLASS}
          data-testid="brain-recent-waves-mobile"
        >
          <div className={MOBILE_WAVE_ROW_CONTENT_CLASS}>
            {recentState.waves.length > 0 ? (
              recentState.waves.map((wave) => (
                <UserPageBrainSidebarMobileWavePill key={wave.id} wave={wave} />
              ))
            ) : (
              <MobileSectionState
                state={recentState}
                emptyMessageKey="user.brain.sidebar.recentEmpty"
              />
            )}

            {recentState.waves.length > 0 && (
              <UserPageBrainSidebarLoadMore
                state={recentState}
                buttonClassName={PILL_BUTTON_CLASS}
                completionClassName="tw-m-0 tw-flex tw-h-9 tw-shrink-0 tw-items-center tw-rounded-lg tw-px-1 tw-text-meta/4 tw-font-normal tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                containerClassName="tw-contents"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
