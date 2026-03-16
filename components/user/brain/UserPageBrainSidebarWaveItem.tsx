"use client";

import type { ReactNode } from "react";
import { LockClosedIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import Link from "next/link";
import Image from "next/image";
import WavesIcon from "@/components/common/icons/WavesIcon";

type BrainSidebarWaveItemDisplay = {
  readonly href: string;
  readonly isPrivate: boolean;
  readonly isDirectMessage: boolean;
  readonly dropsCount: string;
  readonly lastDropTimestamp: ApiWave["metrics"]["latest_drop_timestamp"];
  readonly imageSrc: string | null;
};

const getBrainSidebarWaveItemDisplay = (
  wave: ApiWave
): BrainSidebarWaveItemDisplay => ({
  isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
  href: getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
  }),
  isPrivate:
    Boolean(wave.visibility.scope.group) &&
    !(wave.chat.scope.group?.is_direct_message ?? false),
  dropsCount: numberWithCommas(wave.metrics.drops_count),
  lastDropTimestamp: wave.metrics.latest_drop_timestamp,
  imageSrc: wave.picture
    ? getScaledImageUri(wave.picture, ImageScale.W_200_H_200)
    : null,
});

export default function UserPageBrainSidebarWaveItem({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const {
    href,
    isPrivate,
    isDirectMessage,
    dropsCount,
    lastDropTimestamp,
    imageSrc,
  } = getBrainSidebarWaveItemDisplay(wave);
  const FallbackIcon = isDirectMessage ? ChatBubbleLeftRightIcon : WavesIcon;
  let metaContent: ReactNode = <span>No drops yet</span>;

  if (lastDropTimestamp) {
    metaContent = (
      <>
        <span>{getTimeAgoShort(lastDropTimestamp)}</span>
        <span className="tw-h-0.5 tw-w-0.5 tw-rounded-full tw-bg-white/30" />
        <span>{dropsCount} drops</span>
      </>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className="tw-group tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/80 tw-p-3 tw-no-underline tw-shadow-inner tw-transition-all desktop-hover:hover:tw-border-white/15"
    >
      <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/10">
        <div className="tw-absolute tw-inset-0 tw-z-10 tw-transition-colors desktop-hover:group-hover:tw-bg-transparent" />
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={wave.name ? `Wave ${wave.name}` : "Wave picture"}
            fill
            sizes="40px"
            className="tw-object-cover tw-transition-transform tw-duration-500 tw-will-change-transform desktop-hover:group-hover:tw-scale-110"
          />
        ) : (
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-900">
            <FallbackIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-transform tw-duration-500 tw-will-change-transform desktop-hover:group-hover:tw-scale-110" />
          </div>
        )}
      </div>

      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
        <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
            {isPrivate && (
              <LockClosedIcon className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30" />
            )}
            <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:group-hover:tw-text-iron-50">
              {wave.name}
            </span>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
          {metaContent}
        </div>
      </div>

      <ChevronRightIcon className="tw-h-4 tw-w-4 tw-shrink-0 -tw-translate-x-1 tw-text-iron-600 tw-opacity-0 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-translate-x-0 desktop-hover:group-hover:tw-text-iron-400 desktop-hover:group-hover:tw-opacity-100" />
    </Link>
  );
}
