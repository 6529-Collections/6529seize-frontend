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
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useNextMintSubscription } from "@/hooks/useNextMintSubscription";
import Link from "next/link";

interface NextMintCardProps {
  readonly drop: ApiDrop | null;
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
  const hasDrop = !!drop;
  const { hasTouchScreen } = useDeviceInfo();
  const {
    nextSubscription,
    isSubscribed,
    isLoading: isSubscriptionLoading,
    isMutating: isSubscriptionMutating,
    canToggle,
    toggleSubscription,
  } = useNextMintSubscription(hasDrop);

  if (!drop) {
    return null;
  }

  const media = drop.parts[0]?.media[0];
  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;
  const authorHandle = author.handle ?? author.primary_address;
  const authorName = author.handle ?? "Anonymous";
  const dropHref = getWaveRoute({
    waveId: drop.wave.id,
    extraParams: { drop: drop.id },
    isDirectMessage: false,
    isApp: false,
  });
  const nextMintDate = getNextMintStart();
  const timestamp = formatNextMintDateTime(nextMintDate);
  let subscriptionActionLabel = "Subscribe";
  if (isSubscriptionMutating) {
    subscriptionActionLabel = "Updating...";
  } else if (isSubscribed) {
    subscriptionActionLabel = "Subscribed";
  }
  const isSubscriptionUnavailable = !isSubscriptionLoading && !nextSubscription;
  const onSubscriptionToggle = () => {
    void toggleSubscription();
  };

  return (
    <div className="tw-group tw-flex tw-flex-col tw-text-left tw-transition-all tw-duration-300">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-[#0c0c0c] tw-transition-colors group-hover:tw-border-white/10">
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-1 tw-border-b tw-border-white/5 tw-bg-[#111111] tw-px-2.5 tw-py-1.5 @sm:tw-flex-row @sm:tw-items-center @sm:tw-justify-between sm:tw-px-3 sm:tw-py-2">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-size-1.5 tw-rounded-full tw-bg-emerald-500" />
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-emerald-400">
              NEXT MINT
            </span>
          </div>
          <span className="tw-font-mono tw-text-xs tw-text-white/50">
            {timestamp}
          </span>
        </div>
        <div className="tw-relative tw-flex tw-aspect-[3/4] tw-max-h-[clamp(320px,70vw,500px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/50">
          <div className="tw-[&>div]:tw-mx-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-transform tw-duration-700 tw-ease-out group-hover:tw-scale-105">
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
        <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-white/5 tw-px-3 tw-py-3 sm:tw-px-4">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <MediaTypeBadge
              mimeType={media?.mime_type}
              dropId={drop.id}
              size="sm"
            />
            <Link
              href={dropHref}
              className="tw-m-0 tw-line-clamp-2 tw-min-w-0 tw-flex-1 tw-text-base tw-font-semibold tw-leading-tight tw-text-white tw-no-underline tw-transition-colors group-hover:tw-text-white/80 @lg:tw-line-clamp-1"
            >
              {title}
            </Link>
          </div>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2">
            {authorHandle ? (
              <Link
                href={`/${authorHandle}`}
                className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-no-underline"
              >
                <ProfileAvatar
                  pfpUrl={author.pfp}
                  alt={authorHandle}
                  size={ProfileBadgeSize.SMALL}
                />
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-text-white/50 desktop-hover:hover:tw-text-white">
                  {authorName}
                </span>
              </Link>
            ) : (
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
                <ProfileAvatar
                  pfpUrl={author.pfp}
                  alt={authorName}
                  size={ProfileBadgeSize.SMALL}
                />
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-text-white/50">
                  {authorName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onSubscriptionToggle}
              disabled={
                !canToggle || isSubscriptionLoading || isSubscriptionUnavailable
              }
              className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-white/15 tw-bg-white/[0.04] tw-px-2.5 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-iron-200 tw-transition hover:tw-bg-white/[0.08] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              aria-label="Toggle next mint subscription"
            >
              {subscriptionActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
