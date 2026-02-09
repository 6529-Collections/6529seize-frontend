"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import InteractiveIcon from "@/components/drops/media/InteractiveIcon";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LeadingCardProps {
  readonly drop: ExtendedDrop;
  readonly rank: number;
}

const getRankLabelClass = (rank: number) => {
  if (rank === 1) return "tw-text-[#E8D48A]";
  if (rank === 2) return "tw-text-[#DDDDDD]";
  if (rank === 3) return "tw-text-[#CD7F32]";
  return "tw-text-white/60";
};

export const LeadingCard = ({ drop, rank }: LeadingCardProps) => {
  const { hasTouchScreen } = useDeviceInfo();
  const media = drop.parts[0]?.media[0];
  const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
  const mediaImageScale = isTabletOrSmaller
    ? ImageScale.AUTOx450
    : ImageScale.AUTOx600;
  const isHtml = media?.mime_type === "text/html";
  const shouldGate = hasTouchScreen && isHtml;
  const [interactiveEnabled, setInteractiveEnabled] = useState(!shouldGate);

  useEffect(() => {
    if (shouldGate) {
      setInteractiveEnabled(false);
      return;
    }
    setInteractiveEnabled(true);
  }, [drop.id, shouldGate]);

  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const rankLabelClass = getRankLabelClass(rank);
  const mediaContent = (() => {
    if (!media) {
      return (
        <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-950">
          <span className="tw-text-sm tw-text-white/40">No image</span>
        </div>
      );
    }

    if (shouldGate && !interactiveEnabled) {
      return (
        <div className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-950/30">
          <button
            type="button"
            onClick={() => setInteractiveEnabled(true)}
            className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-transparent"
            aria-label="Load interactive media"
          >
            <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-white/20 tw-bg-iron-950/90 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_16px_40px_rgba(0,0,0,0.65)] tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-900">
              <InteractiveIcon className="tw-size-4 tw-flex-shrink-0" />
              Tap to load
            </span>
          </button>
        </div>
      );
    }

    return (
      <MediaDisplay
        media_mime_type={media.mime_type}
        media_url={media.url}
        disableMediaInteraction={true}
        imageScale={mediaImageScale}
      />
    );
  })();

  return (
    <div className="tw-group tw-flex tw-flex-col tw-text-left tw-transition-all tw-duration-500 desktop-hover:tw-opacity-70 desktop-hover:tw-grayscale desktop-hover:hover:tw-opacity-100 desktop-hover:hover:tw-grayscale-0">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-transition-colors group-hover:tw-border-white/10">
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-1 tw-border-b tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-py-1.5 @sm:tw-flex-row @sm:tw-items-center @sm:tw-justify-between sm:tw-px-3 sm:tw-py-2">
          <span
            className={`tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide ${rankLabelClass}`}
          >
            {rank === 1 ? "LEADING" : `CURRENT TOP ${rank}`}
          </span>
          <span className="tw-font-mono tw-text-xs">
            <span className="tw-text-white/80">
              {formatNumberWithCommas(drop.rating)}
            </span>
            <span className="tw-text-white/50"> TDH</span>
          </span>
        </div>
        <div className="tw-relative tw-flex tw-aspect-[3/4] tw-max-h-[clamp(320px,70vw,500px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950">
          <div className="tw-[&>div]:tw-mx-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-transform tw-duration-700 tw-ease-out group-hover:tw-scale-105">
            {mediaContent}
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-white/10 tw-px-3 tw-py-3 sm:tw-px-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <MediaTypeBadge
              mimeType={media?.mime_type}
              dropId={drop.id}
              size="sm"
            />
            <Link
              href={getWaveRoute({
                waveId: drop.wave.id,
                extraParams: { drop: drop.id },
                isDirectMessage: false,
                isApp: false,
              })}
              className="tw-m-0 tw-line-clamp-2 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-200 tw-no-underline tw-transition-colors group-hover:tw-text-white @lg:tw-line-clamp-1"
            >
              {title}
            </Link>
          </div>
          <Link
            href={`/${author.handle ?? author.primary_address}`}
            className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline"
          >
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "Artist"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-min-w-0 tw-truncate tw-text-xs tw-text-white/50 desktop-hover:hover:tw-text-white">
              {author.handle ?? "Anonymous"}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
