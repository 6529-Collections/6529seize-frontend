"use client";

import { memo } from "react";
import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";

interface BoostedDropCardProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
}

const BoostedDropCard = memo(({ drop, onClick }: BoostedDropCardProps) => {
  const media = drop.parts[0]?.media[0];
  const textContent = drop.parts[0]?.content ?? "";
  const truncatedContent =
    textContent.length > 120 ? `${textContent.slice(0, 120)}...` : textContent;

  const author = drop.author;
  const waveName = drop.wave.name;

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-group tw-relative tw-flex tw-w-60 tw-flex-shrink-0 tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-text-left tw-transition-all tw-duration-200 hover:tw-border-iron-700 hover:tw-bg-iron-900"
    >
      {/* Boost badge */}
      <div className="tw-absolute tw-right-2 tw-top-2 tw-z-10 tw-flex tw-items-center tw-gap-1 tw-rounded-lg tw-bg-black/60 tw-px-2 tw-py-1 tw-backdrop-blur-sm">
        <BoostIcon className="tw-size-3.5 tw-text-amber-500" variant="filled" />
        <span className="tw-text-xs tw-font-semibold tw-text-amber-400">
          {drop.boosts}
        </span>
      </div>

      {/* Content area */}
      <div className="tw-aspect-[3/4] tw-w-full tw-overflow-hidden">
        {media ? (
          <DropListItemContentMedia
            media_mime_type={media.mime_type}
            media_url={media.url}
          />
        ) : (
          <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-900 tw-p-4">
            <p className="tw-m-0 tw-line-clamp-6 tw-text-center tw-text-sm tw-leading-relaxed tw-text-iron-300">
              {truncatedContent || "View drop..."}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tw-flex tw-flex-col tw-gap-0.5 tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2.5">
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
});

BoostedDropCard.displayName = "BoostedDropCard";

export default BoostedDropCard;
