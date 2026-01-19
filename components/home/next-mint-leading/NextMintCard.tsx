"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ImageScale } from "@/helpers/image.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import Link from "next/link";

interface NextMintCardProps {
  readonly drop: ApiDrop;
}

const formatDropTimestamp = (timestamp: number): string | null => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${dateLabel} · ${timeLabel}`;
};

export const NextMintCard = ({ drop }: NextMintCardProps) => {
  const { hasTouchScreen } = useDeviceInfo();
  const media = drop.parts[0]?.media[0];
  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const timestamp = formatDropTimestamp(drop.created_at);

  return (
    <div className="tw-group tw-flex tw-flex-col tw-gap-3 tw-text-left tw-transition-all tw-duration-300 sm:tw-gap-4">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-[#0c0c0c] tw-transition-colors group-hover:tw-border-white/10">
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-1 tw-border-b tw-border-white/5 tw-bg-[#111111] tw-px-2.5 tw-py-1.5 @sm:tw-flex-row @sm:tw-items-center @sm:tw-justify-between sm:tw-px-3 sm:tw-py-2">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-size-1.5 tw-rounded-full tw-bg-emerald-500" />
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-emerald-400">
              NEXT MINT
            </span>
          </div>
          {timestamp && (
            <span className="tw-font-mono tw-text-xs tw-text-white/50">
              {timestamp}
            </span>
          )}
        </div>
        <div className="tw-relative tw-flex tw-aspect-[3/4] tw-max-h-[clamp(320px,70vw,500px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/50 tw-p-2 sm:tw-p-3">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-transform tw-duration-700 tw-ease-out group-hover:tw-scale-105">
            {media ? (
              <DropListItemContentMedia
                media_mime_type={media.mime_type}
                media_url={media.url}
                imageObjectPosition="center"
                imageScale={ImageScale.AUTOx600}
                disableAutoPlay={hasTouchScreen}
                disableModal={hasTouchScreen}
              />
            ) : (
              <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-black/40">
                <span className="tw-text-sm tw-text-white/40">No image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3">
        <div>
          <Link
            href={`/waves?wave=${drop.wave.id}&drop=${drop.id}`}
            className="tw-m-0 tw-line-clamp-2 tw-text-base tw-font-semibold tw-leading-tight tw-text-white tw-no-underline tw-transition-colors group-hover:tw-text-white/80 @lg:tw-line-clamp-1"
          >
            {title}
          </Link>
          <Link
            href={`/${author.handle ?? author.primary_address}`}
            className="tw-mt-2 tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline"
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
