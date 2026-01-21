"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { memo, useCallback, useMemo } from "react";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
}

const BoostedDropCardHome = memo(
  ({ drop, onClick }: BoostedDropCardHomeProps) => {
    const part = drop.parts[0];
    const media = part?.media[0];

    const previewContent = useMemo(
      () => buildProcessedContent(part?.content, part?.media, "View drop..."),
      [part?.content, part?.media]
    );

    // Check if content starts with a link (for icon display)
    const textContent = part?.content ?? "";
    const startsWithLink = /^https?:\/\//i.test(textContent.trim());

    const { author, wave, boosts } = drop;
    const MAX_FIRE_ICONS = 5;
    const fireIconsToShow = Math.min(boosts, MAX_FIRE_ICONS);
    const remainingBoosts = boosts - MAX_FIRE_ICONS;
    const waveName = wave.name;
    const handleCardKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleCardKeyDown}
        className="hover:tw-border-50/10 tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black tw-p-0 tw-text-left tw-transition-all tw-duration-500 tw-ease-out hover:tw--translate-y-1.5 hover:tw-shadow-[0_0_40px_-5px_rgba(255,255,255,0.15)]"
      >
        {/* Inner Highlight (Glass Edge) */}
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-border tw-border-solid tw-border-white/10" />

        {/* Time ago */}
        <div className="tw-absolute tw-left-3 tw-top-3 tw-z-10 tw-rounded-full tw-border tw-border-solid tw-border-iron-50/5 tw-bg-iron-950/60 tw-px-2.5 tw-py-1 tw-shadow-lg tw-backdrop-blur-md">
          <span className="tw-text-[10px] tw-text-iron-400">
            {getTimeAgoShort(drop.created_at)}
          </span>
        </div>

        <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-items-center tw-gap-0.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-50/5 tw-bg-iron-950/60 tw-px-2.5 tw-py-1 tw-shadow-lg tw-backdrop-blur-md">
          {Array.from({ length: fireIconsToShow }).map((_, i) => (
            <BoostIcon
              key={i}
              className="tw-size-3 tw-flex-shrink-0 tw-text-orange-400"
              variant="filled"
            />
          ))}
          {remainingBoosts > 0 && (
            <span className="tw-ml-1 tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-iron-50">
              +{remainingBoosts}
            </span>
          )}
        </div>

        {media ? (
          <div className="tw-relative tw-aspect-[8/5] tw-w-full tw-overflow-hidden tw-rounded-xl">
            <div className="tw-relative tw-h-full tw-w-full">
              {/* Glow effect */}
              <div
                className="tw-pointer-events-none tw-absolute tw-inset-0 tw-opacity-40 tw-blur-3xl tw-transition-opacity tw-duration-700 group-hover:tw-opacity-60"
                style={{
                  backgroundImage: `url(${getScaledImageUri(media.url, ImageScale.AUTOx450)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/0 tw-via-black/35 tw-to-black/75" />
              <div className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-p-5 tw-transition-transform tw-duration-700 group-hover:tw-scale-[1.02]">
                <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden">
                  <DropListItemContentMedia
                    media_mime_type={media.mime_type}
                    media_url={media.url}
                    imageScale={ImageScale.AUTOx450}
                    imageObjectPosition="center"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="tw-relative tw-flex tw-aspect-[8/5] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-p-6">
            {startsWithLink ? (
              <LinkIcon className="tw-absolute tw-left-6 tw-top-8 tw-size-6 tw-text-iron-700 tw-opacity-50" />
            ) : (
              <span className="tw-absolute tw-left-6 tw-top-8 tw-select-none tw-font-serif tw-text-6xl tw-leading-none tw-text-iron-800 tw-opacity-50">
                {"\u201C"}
              </span>
            )}
            <ContentDisplay
              content={previewContent}
              shouldClamp={false}
              className="tw-flex tw-w-full tw-flex-col tw-items-center tw-gap-1 tw-whitespace-pre-wrap tw-break-words tw-text-center tw-font-serif tw-text-lg tw-font-normal tw-leading-relaxed tw-text-iron-300"
              textClassName="tw-line-clamp-6 tw-w-full tw-whitespace-pre-wrap tw-break-words tw-text-center tw-leading-relaxed"
            />
          </div>
        )}

        <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black tw-px-4 tw-py-3">
          {/* Author */}
          <Link
            href={author.handle ? `/${author.handle}` : "#"}
            onClick={(event) => event.stopPropagation()}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-transition-opacity desktop-hover:hover:tw-opacity-80"
          >
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "User"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              {author.handle ?? "Anonymous"}
            </span>
          </Link>

          {/* Wave */}
          <Link
            href={`/waves?wave=${wave.id}`}
            onClick={(event) => event.stopPropagation()}
            className="tw-group/wave tw-flex tw-items-center tw-gap-2 tw-no-underline tw-transition-all"
          >
            <span className="tw-text-xs tw-text-iron-500 tw-transition-colors desktop-hover:group-hover/wave:tw-text-iron-300 desktop-hover:group-hover/wave:tw-underline">{waveName}</span>
            {wave.picture && (
              <img
                src={getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)}
                alt={waveName}
                className="tw-size-6 tw-rounded-md tw-object-cover tw-ring-1 tw-ring-transparent tw-transition-all desktop-hover:group-hover/wave:tw-ring-iron-600"
              />
            )}
          </Link>
        </div>
      </div>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
