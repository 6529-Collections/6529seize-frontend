"use client";

import { memo } from "react";
import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ImageScale } from "@/helpers/image.helpers";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
}

const BoostedDropCardHome = memo(
  ({ drop, onClick }: BoostedDropCardHomeProps) => {
    const textLimit = 180;
    const media = drop.parts[0]?.media[0];
    const textContent = drop.parts[0]?.content ?? "";
    const isLongText = textContent.length > textLimit;
    const truncatedContent =
      textContent.length > textLimit
        ? `${textContent.slice(0, textLimit)}...`
        : textContent;

    const author = drop.author;
    const waveName = drop.wave.name;

    return (
      <button
        type="button"
        onClick={onClick}
        className="tw-group tw-relative tw-flex tw-w-60 tw-flex-shrink-0 tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-0 tw-text-left tw-transition-all tw-duration-300 hover:tw-border-white/10"
      >
        {/* Boost badge */}
        <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-z-10 tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-black/35 tw-px-2 tw-py-1 tw-shadow-sm tw-backdrop-blur">
          <BoostIcon
            className="tw-size-4 tw-flex-shrink-0 tw-text-orange-400"
            variant="filled"
          />
          <span className="tw-text-[10px] tw-font-semibold tw-tabular-nums tw-text-orange-300">
            {drop.boosts}
          </span>
        </div>

        {/* Content area */}
        <div className="tw-aspect-[3/4] tw-w-full tw-overflow-hidden">
          {media ? (
            <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-p-1">
              <DropListItemContentMedia
                media_mime_type={media.mime_type}
                media_url={media.url}
                imageScale={ImageScale.AUTOx450}
                imageObjectPosition="center"
              />
            </div>
          ) : (
            <div className="tw-relative tw-flex tw-size-full tw-items-center tw-justify-center tw-p-4">
              <div className="tw-relative">
                <p
                  style={{
                    wordBreak: "break-word",
                  }}
                  className="tw-m-0 tw-line-clamp-6 tw-whitespace-pre-wrap tw-break-words tw-text-center tw-text-sm tw-leading-relaxed tw-text-iron-300"
                >
                  {truncatedContent || "View drop..."}
                </p>
              {isLongText && (
                <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-10 tw-bg-gradient-to-b tw-from-iron-950/0 tw-via-iron-950/40 tw-to-iron-950/90" />
              )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tw-flex tw-flex-col tw-gap-0.5 tw-border-t tw-border-iron-800 tw-bg-black tw-px-3 tw-py-2.5">
          <div className="tw-flex tw-items-center tw-gap-2">
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "User"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-truncate tw-text-sm tw-font-medium tw-text-iron-200">
              {author.handle ?? "Anonymous"}
            </span>
          </div>
          <span className="tw-truncate tw-pl-9 tw-text-xs tw-text-iron-500">
            {waveName}
          </span>
        </div>
      </button>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
