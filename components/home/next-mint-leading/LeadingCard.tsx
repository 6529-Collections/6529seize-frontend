"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { formatOrdinal } from "@/helpers/format.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  getDropPreviewImageUrl,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";

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

  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const rankLabelClass = getRankLabelClass(rank);

  const htmlPreviewImageUrl = shouldGate
    ? (getDropPreviewImageUrl(drop.metadata) ?? undefined)
    : undefined;
  const mediaContent = (() => {
    if (!media) {
      return (
        <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-950">
          <span className="tw-text-sm tw-text-white/40">No image</span>
        </div>
      );
    }

    return (
      <MediaDisplay
        media_mime_type={media.mime_type}
        media_url={media.url}
        disableMediaInteraction={true}
        imageScale={mediaImageScale}
        previewImageUrl={htmlPreviewImageUrl}
        requireInteractionToLoad={shouldGate}
      />
    );
  })();

  return (
    <div className="tw-group tw-min-w-0 tw-snap-start tw-text-left">
      <div className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-transition-[border-color,transform] tw-duration-200 desktop-hover:hover:tw-border-white/20 motion-reduce:tw-transition-none motion-safe:md:desktop-hover:hover:-tw-translate-y-0.5">
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-z-10 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2 tw-bg-gradient-to-b tw-from-black/70 tw-to-transparent tw-px-3.5 tw-pb-7 tw-pt-3.5">
          <span
            className={`tw-rounded-md tw-bg-black/60 tw-px-2 tw-py-1 tw-text-[10.5px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.06em] ${rankLabelClass}`}
          >
            {rank === 1 ? "LEADING" : `${formatOrdinal(rank)} PLACE`}
          </span>
          <span className="tw-rounded-md tw-bg-black/60 tw-px-2 tw-py-1 tw-text-[11px] tw-font-medium tw-tabular-nums tw-leading-4 tw-text-white/90 md:tw-text-xs">
            {formatNumberWithCommas(drop.rating)} TDH
          </span>
        </div>
        <div className="tw-relative tw-flex tw-aspect-[4/5] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center [&>div]:tw-mx-0">
            {mediaContent}
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2.5 tw-px-4 tw-pb-4 tw-pt-3.5 md:tw-px-5 md:tw-pb-5 md:tw-pt-4">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <MediaTypeBadge
              mimeType={media?.mime_type}
              dropId={drop.id}
              size="sm"
            />
            <Link
              data-home-action="Open drop"
              href={getWaveRoute({
                waveId: drop.wave.id,
                extraParams: { drop: drop.id },
                isDirectMessage: false,
                isApp: false,
              })}
              className="tw-m-0 tw-line-clamp-2 tw-min-h-6 tw-min-w-0 tw-text-[15px] tw-font-semibold tw-leading-6 tw-tracking-tight tw-text-white tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 md:tw-text-base"
            >
              {title}
            </Link>
          </div>
          <Link
            data-home-action="Open artist profile"
            href={`/${author.handle ?? author.primary_address}`}
            className="tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          >
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "Artist"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-min-w-0 tw-truncate tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-white">
              {author.handle ?? "Anonymous"}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
