"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import {
  formatFullDateTime,
  getNextMintStart,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { NextMintSubscribeButton } from "@/components/home/next-mint/NextMintSubscribeButton";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import Image from "next/image";
import Link from "next/link";
import NowMintingStatsItem from "./NowMintingStatsItem";

interface LatestDropNextMintSectionProps {
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

export default function LatestDropNextMintSection({
  drop,
}: LatestDropNextMintSectionProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const media = drop.parts[0]?.media[0];
  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const authorHandle = author.handle ?? author.primary_address;
  const authorName = author.handle ?? "Anonymous";
  const submittedAt = formatDropTimestamp(drop.created_at);
  const description =
    drop.metadata.find((m) => m.data_key === "description")?.data_value ?? null;
  const nextMintStart = getNextMintStart();
  const nextMintLabel = formatFullDateTime(nextMintStart, "local");

  return (
    <section className="tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-6 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8">
      <span className="tw-mb-3 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 md:tw-mb-4 md:tw-text-2xl">
        Next Drop
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-950">
        <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-x-6 tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
          <div className="tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
            <div className="tw-relative tw-flex tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/50">
              <div className="tw-[&>div]:tw-mx-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
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
                    <span className="tw-text-sm tw-text-white/40">
                      No image
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tw-p-5 md:tw-p-6 lg:tw-col-span-6 xl:tw-col-span-4">
            <div className="tw-flex tw-flex-col tw-gap-5">
              <div className="tw-flex tw-flex-col">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                    <span className="tw-size-1.5 tw-rounded-full tw-bg-emerald-500" />
                    <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-emerald-400">
                      NEXT MINT
                    </span>
                    <span className="tw-font-mono tw-text-xs tw-text-white/50">
                      {nextMintLabel}
                    </span>
                  </div>
                  <NextMintSubscribeButton />
                </div>

                <Link
                  href={`/waves?wave=${drop.wave.id}&drop=${drop.id}`}
                  className="tw-mt-3 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
                >
                  {title}
                </Link>

                {description && (
                  <p className="tw-mt-3 tw-line-clamp-2 tw-text-sm tw-leading-relaxed tw-text-iron-300">
                    {description}
                  </p>
                )}

                {authorHandle ? (
                  <Link
                    href={`/${authorHandle}`}
                    className="tw-mt-3 tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline"
                  >
                    <ProfileAvatar
                      pfpUrl={author.pfp}
                      alt={authorHandle || authorName}
                      size={ProfileBadgeSize.SMALL}
                    />
                    <span className="tw-min-w-0 tw-truncate tw-text-sm tw-text-iron-200 desktop-hover:hover:tw-text-iron-100">
                      {authorName}
                    </span>
                  </Link>
                ) : (
                  <div className="tw-mt-3 tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                    <ProfileAvatar
                      pfpUrl={author.pfp}
                      alt={authorName}
                      size={ProfileBadgeSize.SMALL}
                    />
                    <span className="tw-min-w-0 tw-truncate tw-text-sm tw-text-iron-200">
                      {authorName}
                    </span>
                  </div>
                )}
              </div>

              <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-4">
                <div className="tw-col-span-2">
                  <NowMintingStatsItem
                    label="Wave"
                    allowWrap
                    value={
                      <Link
                        href={`/waves?wave=${drop.wave.id}`}
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-100 tw-no-underline desktop-hover:hover:tw-text-iron-200"
                      >
                        {drop.wave.picture && (
                          <Image
                            src={getScaledImageUri(
                              drop.wave.picture,
                              ImageScale.W_AUTO_H_50
                            )}
                            alt={drop.wave.name}
                            width={20}
                            height={20}
                            className="tw-size-5 tw-shrink-0 tw-rounded-full tw-object-cover tw-ring-1 tw-ring-white/10"
                          />
                        )}
                        <span className="tw-min-w-0 tw-break-words">
                          {drop.wave.name}
                        </span>
                      </Link>
                    }
                  />
                </div>
                <NowMintingStatsItem
                  label="Submitted"
                  value={submittedAt ?? "—"}
                />
                <NowMintingStatsItem
                  label="Rating"
                  value={`${formatNumberWithCommas(drop.rating)} TDH`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
