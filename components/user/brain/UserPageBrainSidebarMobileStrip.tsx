"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { ImageScale } from "@/helpers/image.helpers";
import type { SidebarWave } from "@/types/waves.types";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import {
  getSidebarWaveHref,
  getSidebarWaveImageSrc,
  getSidebarWaveIsDirectMessage,
  type UserPageBrainSidebarWave,
} from "./userPageBrainSidebarWave.helpers";

interface UserPageBrainSidebarMobileStripProps {
  readonly createdWaves: ApiWave[];
  readonly mostActiveWaves: SidebarWave[];
  readonly onOpenCreatedWaves: () => void;
}

function UserPageBrainSidebarMobileWavePill({
  wave,
}: {
  readonly wave: UserPageBrainSidebarWave;
}) {
  const isDirectMessage = getSidebarWaveIsDirectMessage(wave);
  const href = getSidebarWaveHref(wave);
  const imageSrc = getSidebarWaveImageSrc(wave, ImageScale.W_200_H_200);
  const FallbackIcon = isDirectMessage ? ChatBubbleLeftRightIcon : WavesIcon;

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
            alt={
              wave.name
                ? getUserPageBrainSidebarMessage(
                    "user.brain.sidebar.waveImageAlt",
                    { waveName: wave.name }
                  )
                : getUserPageBrainSidebarMessage(
                    "user.brain.sidebar.wavePictureAlt"
                  )
            }
            fill
            sizes="28px"
            className="tw-object-cover"
          />
        ) : (
          <FallbackIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-300" />
        )}
      </div>
      <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors desktop-hover:group-hover:tw-text-iron-100">
        {wave.name}
      </span>
    </Link>
  );
}

export default function UserPageBrainSidebarMobileStrip({
  createdWaves,
  mostActiveWaves,
  onOpenCreatedWaves,
}: UserPageBrainSidebarMobileStripProps) {
  const shouldShowCreatedSection = createdWaves.length > 0;
  const shouldShowMostActiveSection = mostActiveWaves.length > 0;

  if (!shouldShowCreatedSection && !shouldShowMostActiveSection) {
    return null;
  }

  const firstCreatedWave = createdWaves[0];
  const remainingCreatedCount = Math.max(createdWaves.length - 1, 0);
  const createdSectionContent = firstCreatedWave ? (
    <>
      <UserPageBrainSidebarMobileWavePill wave={firstCreatedWave} />
      {remainingCreatedCount > 0 && (
        <button
          type="button"
          onClick={onOpenCreatedWaves}
          className="tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-400 tw-shadow-sm tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/[0.15] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100 motion-reduce:tw-transition-none"
          aria-label={getUserPageBrainSidebarMessage(
            "user.brain.sidebar.viewAllCreatedWaves"
          )}
        >
          <PlusIcon className="tw-h-3 tw-w-3 tw-flex-shrink-0" />
          <span>{remainingCreatedCount}</span>
        </button>
      )}
    </>
  ) : null;

  return (
    <section
      aria-label={getUserPageBrainSidebarMessage(
        "user.brain.sidebar.mobileStripLabel"
      )}
      className="tw-mb-4 lg:tw-hidden"
      data-testid="brain-sidebar-mobile-strip"
    >
      <div className="tw-relative">
        <div className="tw-flex tw-items-end tw-gap-4 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1.5 tw-pr-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
          {shouldShowCreatedSection && (
            <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
              <span className="tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                {getUserPageBrainSidebarMessage(
                  "user.brain.sidebar.createdMobileHeading"
                )}
              </span>
              <div className="tw-flex tw-items-center tw-gap-2">
                {createdSectionContent}
              </div>
            </div>
          )}

          {shouldShowCreatedSection && shouldShowMostActiveSection && (
            <div className="tw-mb-1 tw-h-11 tw-w-px tw-shrink-0 tw-bg-white/5" />
          )}

          {shouldShowMostActiveSection && (
            <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
              <div className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5 tw-px-1">
                <span className="tw-shrink-0 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                  {getUserPageBrainSidebarMessage(
                    "user.brain.sidebar.mostActiveHeading"
                  )}
                </span>
                <span className="tw-max-w-44 tw-truncate tw-text-[10px] tw-font-normal tw-text-iron-600">
                  ·{" "}
                  {getUserPageBrainSidebarMessage(
                    "user.brain.sidebar.rankingBasis"
                  )}
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-flex tw-items-center tw-gap-2">
                  {mostActiveWaves.map((wave) => (
                    <UserPageBrainSidebarMobileWavePill
                      key={wave.id}
                      wave={wave}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
