"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { getNextMintStart } from "@/components/meme-calendar/meme-calendar.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import Link from "next/link";
import clsx from "clsx";
import {
  ComingUpArtistCredits,
  type ComingUpCreditSource,
} from "./ComingUpArtistCredits";

interface NextMintCardProps {
  readonly drop: ApiDrop & ComingUpCreditSource;
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
    <div className="tw-group tw-min-w-0 tw-text-left">
      <div className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-transition-colors tw-duration-200 tw-ease-out focus-within:tw-border-white/20 desktop-hover:hover:tw-border-white/20 motion-reduce:tw-transition-none">
        <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-py-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span
              aria-hidden="true"
              className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-emerald-500"
            />
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-emerald-400">
              NEXT MINT
            </span>
          </div>
          <span className="tw-text-xs tw-font-medium tw-tabular-nums tw-leading-4 tw-text-iron-400">
            {timestamp}
          </span>
        </div>
        <div
          data-testid="coming-up-artwork"
          className={clsx(
            "tw-relative tw-flex tw-aspect-[3/4] tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950",
            media?.mime_type.startsWith("image/") &&
              "max-md:has-[img.tw-opacity-100]:tw-aspect-auto max-md:[&_[data-drop-image-content]]:tw-relative max-md:[&_[data-drop-image-content]]:tw-block max-md:[&_img]:!tw-relative max-md:[&_img]:tw-block max-md:[&_img]:!tw-h-auto max-md:[&_img]:!tw-max-h-none"
          )}
        >
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center [&>div]:tw-mx-0 [&>div]:tw-justify-center">
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
        <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-pb-5 tw-pt-5">
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
              className="tw-m-0 tw-line-clamp-2 tw-min-h-6 tw-min-w-0 tw-flex-1 tw-text-[17px] tw-font-semibold tw-leading-[1.3] tw-tracking-[-0.015em] tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-rounded-sm focus-visible:tw-text-iron-300 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none"
            >
              {title}
            </Link>
          </div>
          <ComingUpArtistCredits
            author={author}
            collaborators={drop.collaborators ?? []}
            dropHref={getWaveRoute({
              waveId: drop.wave.id,
              extraParams: { drop: drop.id },
              isDirectMessage: false,
              isApp: false,
            })}
          />
        </div>
      </div>
    </div>
  );
};
