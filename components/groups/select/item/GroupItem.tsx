"use client";

import { useEffect, useState } from "react";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Link from "next/link";
import GroupItemWrapper from "./GroupItemWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getTimeAgo } from "@/helpers/Helpers";

export default function GroupItem({
  group,
  activeGroupId,
  onActiveGroupId,
}: {
  readonly group: ApiGroupFull;
  readonly activeGroupId: string | null;
  readonly onActiveGroupId?:
    | ((groupId: string | null) => void)
    | undefined
    | undefined;
}) {
  const getIsActive = (): boolean =>
    !!activeGroupId && activeGroupId === group.id;

  const [isActive, setIsActive] = useState(getIsActive());

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeGroupId]);

  const deActivate = () => {
    if (!isActive || !onActiveGroupId) return;
    onActiveGroupId(null);
  };

  const [deactivateHover, setDeactivateHover] = useState(false);
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());

  return (
    <GroupItemWrapper
      group={group}
      isActive={isActive}
      deactivateHover={deactivateHover}
      onActiveGroupId={onActiveGroupId}
    >
      <div className="-tw-mt-1 tw-bg-iron-900 tw-flex tw-flex-col tw-rounded-b-xl tw-relative ">
        {isActive && onActiveGroupId && (
          <div className="tw-absolute -tw-right-2 -tw-top-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deActivate();
              }}
              onMouseEnter={() => setDeactivateHover(true)}
              onMouseLeave={() => setDeactivateHover(false)}
              type="button"
              className="tw-group tw-p-1.5 tw-bg-iron-800 tw-border-0 tw-flex tw-items-center tw-justify-center tw-rounded-full"
            >
              <span className="tw-sr-only">Remove</span>
              <svg
                className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-h-full">
          <div className="tw-px-3 tw-flex tw-gap-x-3">
            {group.created_by.pfp ? (
              <img
                className="-tw-mt-1.5 tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
                src={getScaledImageUri(
                  group.created_by.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="Profile Picture"
              />
            ) : (
              <div className="-tw-mt-1 tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"></div>
            )}
            <div className="tw-mt-1 tw-text-sm tw-flex tw-items-center tw-w-full tw-justify-between">
              <span className="tw-text-iron-50 tw-font-semibold">
                <Link
                  href={`/${group.created_by?.handle}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="tw-no-underline hover:tw-underline tw-group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-text-iron-50 tw-text-sm tw-font-medium"
                >
                  {group.created_by?.handle}
                </Link>
              </span>
              <span className="tw-text-iron-400 tw-font-normal tw-text-xs">
                {timeAgo}
              </span>
            </div>
          </div>
          <div className="tw-pt-3 tw-pb-3 tw-flex tw-flex-col tw-h-full tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-flex-1 tw-px-3">
              <p className="tw-mb-0 tw-text-base tw-text-iron-50 tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-overflow-ellipsis tw-truncate">
                {group.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GroupItemWrapper>
  );
}
