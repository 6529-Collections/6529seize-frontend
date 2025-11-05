"use client";

import Link from "next/link";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getTimeAgo } from "@/helpers/Helpers";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import GroupCardEditActions from "./actions/GroupCardEditActions";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function GroupCardHeader({
  group,
  onEditClick,
  userPlaceholder,
}: {
  readonly group?: ApiGroupFull;
  readonly onEditClick?: (group: ApiGroupFull) => void;
  readonly userPlaceholder?: string;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const timeAgo = group
    ? getTimeAgo(new Date(group.created_at ?? "").getTime())
    : "";

  const profileHref =
    group && group.created_by.handle
      ? `/${group.created_by.handle}`
      : userPlaceholder ?? "";

  return (
    <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-4 tw-gap-y-3">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-xl tw-ring-1 tw-ring-white/15 tw-shadow-inner tw-shadow-black/40">
          {group?.created_by.pfp ? (
            <img
              src={getScaledImageUri(
                group.created_by.pfp,
                ImageScale.W_AUTO_H_50
              )}
              alt={
                group?.created_by.handle
                  ? `${group.created_by.handle} profile picture`
                  : "Group creator profile picture"
              }
              className="tw-h-full tw-w-full tw-object-cover tw-bg-white/5"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="tw-h-full tw-w-full tw-bg-white/5" />
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-y-1">
          <Link
            onClick={(e) => e.stopPropagation()}
            href={profileHref}
            className="tw-relative tw-z-30 tw-inline-flex tw-items-center tw-gap-x-1 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300"
          >
            <span>{group?.created_by.handle ?? userPlaceholder}</span>
          </Link>
          {timeAgo && (
            <span className="tw-text-xs tw-font-medium tw-text-iron-200/75">
              Created {timeAgo}
            </span>
          )}
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        {!!connectedProfile?.handle &&
          !activeProfileProxy &&
          onEditClick &&
          group && (
            <GroupCardEditActions group={group} onEditClick={onEditClick} />
          )}
      </div>
    </div>
  );
}
