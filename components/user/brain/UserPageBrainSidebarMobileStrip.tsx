"use client";

import { LockClosedIcon, PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import {
  getSidebarWaveHref,
  getSidebarWaveImageSrc,
} from "./userPageBrainSidebarWave.helpers";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";

const PILL_BUTTON_CLASS =
  "tw-inline-flex tw-h-9 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-400 tw-shadow-sm tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100 motion-reduce:tw-transition-none";

function UserPageBrainSidebarMobileWavePill({
  wave,
}: {
  readonly wave: ProfileWaveActivitySidebarItem;
}) {
  const locale = useBrowserLocale();
  const href = getSidebarWaveHref(wave);
  const imageSrc = getSidebarWaveImageSrc(wave, ImageScale.W_200_H_200);

  return (
    <Link
      href={href}
      prefetch={false}
      className="tw-group tw-inline-flex tw-h-9 tw-max-w-[14rem] tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-1 tw-pr-3 tw-no-underline tw-shadow-sm tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] motion-reduce:tw-transition-none"
    >
      <div className="tw-relative tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 tw-shadow-sm tw-transition-colors desktop-hover:group-hover:tw-border-white/[0.1]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="28px"
            className="tw-object-cover"
          />
        ) : (
          <WavesIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-300" />
        )}
      </div>
      {wave.isPrivate && (
        <>
          <LockClosedIcon
            aria-hidden="true"
            className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/40"
          />
          <span className="tw-sr-only">
            {getUserPageBrainSidebarMessage(
              locale,
              "user.brain.sidebar.privateWave"
            )}
          </span>
        </>
      )}
      <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors desktop-hover:group-hover:tw-text-iron-100">
        {wave.name}
      </span>
    </Link>
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
      <span className="tw-flex tw-h-9 tw-items-center tw-px-1 tw-text-xs tw-text-iron-600">
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
      className="lg:tw-hidden"
      data-testid="brain-sidebar-mobile-strip"
    >
      <div className="tw-flex tw-items-end tw-gap-4 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1.5 tw-pr-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
        {showCreatedSection && (
          <>
            <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
              <span className="tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                {getUserPageBrainSidebarMessage(
                  locale,
                  "user.brain.sidebar.createdMobileHeading"
                )}
              </span>
              <div className="tw-flex tw-items-center tw-gap-2">
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

            <div
              aria-hidden="true"
              className="tw-mb-1 tw-h-11 tw-w-px tw-shrink-0 tw-bg-white/5"
            />
          </>
        )}

        <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
          <span className="tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {getUserPageBrainSidebarMessage(
              locale,
              "user.brain.sidebar.recentlyActiveHeading"
            )}
          </span>
          <div className="tw-flex tw-items-center tw-gap-2">
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
                completionClassName="tw-m-0 tw-flex tw-h-9 tw-shrink-0 tw-items-center tw-rounded-lg tw-px-1 tw-text-xs tw-font-semibold tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                containerClassName="tw-contents"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
