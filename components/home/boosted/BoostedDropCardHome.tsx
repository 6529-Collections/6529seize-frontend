"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { LinkIcon } from "@heroicons/react/24/outline";
import { memo } from "react";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
}

const BoostedDropCardHome = memo(
  ({ drop, onClick }: BoostedDropCardHomeProps) => {
    const part = drop.parts?.[0];
    const media = part?.media?.[0];
    const textContent = part?.content ?? "";

    const textLimit = 180;
    const shouldTruncate = textContent.length > textLimit;
    const truncatedContent = shouldTruncate
      ? `${textContent.slice(0, textLimit)}…`
      : textContent;

    // Check if content is primarily a link
    const urlRegex = /^https?:\/\/[^\s]+$/i;
    const isLink = urlRegex.test(textContent.trim());

    const { author, wave, boosts } = drop;
    const waveName = wave.name;

    return (
      <button
        type="button"
        onClick={onClick}
        className="tw-group tw-relative tw-flex tw-w-60 tw-flex-shrink-0 tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-black tw-p-0 tw-text-left tw-border tw-border-solid tw-border-white/5 tw-transition-all tw-duration-500 tw-ease-out hover:tw--translate-y-1.5 hover:tw-shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:tw-border-50/10"
      >
         {/* Inner Highlight (Glass Edge) */}
        <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-pointer-events-none tw-z-20" />

        <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-iron-950/60 tw-px-2.5 tw-py-1 tw-backdrop-blur-md tw-shadow-lg tw-border tw-border-solid tw-border-iron-50/5">
          <BoostIcon
            className="tw-size-3 tw-flex-shrink-0 tw-text-orange-400"
            variant="filled"
          />
          <span className="tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-iron-50">
            {boosts}
          </span>
        </div>

        <div className="tw-aspect-[3/4] tw-w-full tw-relative tw-overflow-hidden tw-rounded-xl">
          {media ? (
            <div className="tw-relative tw-h-full tw-w-full">
              {/* Glow effect */}
              <div
                className="tw-pointer-events-none tw-absolute tw-inset-0 tw-opacity-70 tw-blur-3xl tw-transition-opacity tw-duration-700 group-hover:tw-opacity-85"
                style={{
                  backgroundImage: `url(${getScaledImageUri(media.url, ImageScale.AUTOx450)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/0 tw-via-black/35 tw-to-black/75" />
              <div className="tw-relative tw-rounded-xl tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-p-5 tw-transition-transform tw-duration-700 group-hover:tw-scale-[1.02]">
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
          ) : (
            <div className="tw-relative tw-flex tw-size-full tw-items-center tw-justify-center tw-p-6">
              {isLink ? (
                <LinkIcon className="tw-absolute tw-left-6 tw-top-8 tw-size-6 tw-text-iron-700 tw-opacity-50" />
              ) : (
                <span className="tw-absolute tw-left-6 tw-top-8 tw-select-none tw-font-serif tw-text-6xl tw-leading-none tw-text-iron-800 tw-opacity-50">
                  {"\u201C"}
                </span>
              )}
              <div className="tw-relative tw-z-10">
                <p
                  style={{ wordBreak: "break-word" }}
                  className={`tw-m-0 tw-line-clamp-6 tw-whitespace-pre-wrap tw-break-words tw-text-center tw-text-md tw-leading-relaxed tw-font-normal ${isLink ? "tw-text-blue-400" : "tw-text-iron-300"}`}
                >
                  {truncatedContent || "View drop..."}
                </p>
                {shouldTruncate && (
                  <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-16 tw-bg-gradient-to-b tw-from-transparent tw-to-black" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-3 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-900 tw-bg-black tw-px-4 tw-py-4">
          <ProfileAvatar
            pfpUrl={author.pfp}
            alt={author.handle ?? "User"}
            size={ProfileBadgeSize.SMALL}
          />
          <div className="tw-flex tw-min-w-0 tw-flex-col">
            <span className="tw-truncate tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-colors group-hover:tw-text-white">
              {author.handle ?? "Anonymous"}
            </span>
            <span className="tw-truncate tw-text-xs tw-text-iron-500 tw-transition-colors group-hover:tw-text-iron-400">
              {waveName}
            </span>
          </div>
        </div>
      </button>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
