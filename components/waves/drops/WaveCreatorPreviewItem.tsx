"use client";

import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getTimeAgoShort } from "@/helpers/Helpers";
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import WavesIcon from "@/components/common/icons/WavesIcon";

interface WaveCreatorPreviewItemProps {
  readonly wave: ApiWave;
}

export const WaveCreatorPreviewItem: React.FC<WaveCreatorPreviewItemProps> = ({
  wave,
}) => {
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const waveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage,
    isApp: false,
  });
  const imageSrc = wave.picture
    ? getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)
    : null;
  const FallbackIcon = isDirectMessage ? ChatBubbleLeftRightIcon : WavesIcon;

  return (
    <Link
      href={waveHref}
      prefetch={false}
      className="tw-group tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800/70 tw-bg-iron-950/60 tw-px-4 tw-py-3 tw-no-underline tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900/60"
    >
      <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={wave.name ? `Wave ${wave.name}` : "Wave picture"}
            width={40}
            height={40}
            className="tw-h-full tw-w-full tw-object-cover"
          />
        ) : (
          <FallbackIcon className="tw-h-4 tw-w-4 tw-text-iron-300" />
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
          {wave.name}
        </div>
        <div className="tw-truncate tw-text-xs tw-text-iron-500">
          {wave.metrics.latest_drop_timestamp ? (
            <>
              <span>Last drop: </span>
              <span className="tw-text-iron-300">
                {getTimeAgoShort(wave.metrics.latest_drop_timestamp)}
              </span>
            </>
          ) : (
            "No drops yet"
          )}
        </div>
      </div>
      <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500 desktop-hover:group-hover:tw-text-iron-300" />
    </Link>
  );
};
