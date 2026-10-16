"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { getNextMintStart } from "@/components/meme-calendar/meme-calendar.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import Link from "next/link";

interface NextMintCardProps {
  readonly drop: ApiDrop;
}

const formatNextMintDateTime = (date: Date): string => {
  const dateParts = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const day = dateParts.find((p) => p.type === "day")?.value ?? "";
  const month = dateParts.find((p) => p.type === "month")?.value ?? "";
  const dateLabel = `${day} ${month}`;
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dateLabel} · ${timeLabel}`;
};

export const NextMintCard = ({ drop }: NextMintCardProps) => {
  const { hasTouchScreen } = useDeviceInfo();
  const media = drop.parts[0]?.media[0];
  const isHtml = media?.mime_type === "text/html";
  const htmlPreviewImageUrl =
    hasTouchScreen && isHtml
      ? (getDropPreviewImageUrl(drop.metadata) ?? undefined)
      : undefined;
  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const nextMintDate = getNextMintStart();
  const timestamp = formatNextMintDateTime(nextMintDate);

  return (
    <div className="tw-group tw-min-w-0 tw-snap-start tw-text-left">
      <div className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-transition-[border-color,transform] tw-duration-200 desktop-hover:hover:tw-border-white/20 motion-reduce:tw-transition-none motion-safe:md:desktop-hover:hover:-tw-translate-y-0.5">
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-z-10 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2 tw-bg-gradient-to-b tw-from-black/70 tw-to-transparent tw-px-3.5 tw-pb-7 tw-pt-3.5">
          <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-black/60 tw-px-2 tw-py-1">
            <span
              aria-hidden="true"
              className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-emerald-500"
            />
            <span className="tw-text-[10.5px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.06em] tw-text-emerald-400">
              NEXT MINT
            </span>
          </div>
          <span className="tw-rounded-md tw-bg-black/60 tw-px-2 tw-py-1 tw-text-[11px] tw-font-medium tw-tabular-nums tw-leading-4 tw-text-white/90 md:tw-text-xs">
            {timestamp}
          </span>
        </div>
        <div className="tw-relative tw-flex tw-aspect-[4/5] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center [&>div]:tw-mx-0">
            {media ? (
              <DropListItemContentMedia
                media_mime_type={media.mime_type}
                media_url={media.url}
                imageObjectPosition="center"
                imageScale={ImageScale.AUTOx600}
                disableAutoPlay={hasTouchScreen}
                disableModal={hasTouchScreen}
                htmlPreviewImageUrl={htmlPreviewImageUrl}
              />
            ) : (
              <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-950">
                <span className="tw-text-sm tw-text-white/40">No image</span>
              </div>
            )}
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
              className="tw-m-0 tw-line-clamp-2 tw-min-h-6 tw-min-w-0 tw-flex-1 tw-text-[15px] tw-font-semibold tw-leading-6 tw-tracking-tight tw-text-white tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 md:tw-text-base"
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
