"use client";

import { useEffect, useState } from "react";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Link from "next/link";
import Image from "next/image";
import GroupItemWrapper from "./GroupItemWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getTimeAgo } from "@/helpers/Helpers";
import type { GroupSelectVariant } from "../groupSelect.types";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function GroupItem({
  group,
  activeGroupId,
  onActiveGroupId,
  variant = "default",
}: {
  readonly group: ApiGroupFull;
  readonly activeGroupId: string | null;
  readonly onActiveGroupId?:
    | ((groupId: string | null) => void)
    | undefined
    | undefined;
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const isMobileSheet = variant === "mobile-sheet";
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

  const profilePicture = group.created_by.pfp ? (
    <div
      className={
        isMobileSheet
          ? "tw-relative tw-size-11 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800"
          : "tw-relative -tw-mt-1.5 tw-h-7 tw-w-7 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
      }
    >
      <Image
        src={getScaledImageUri(group.created_by.pfp, ImageScale.W_AUTO_H_50)}
        alt="Profile Picture"
        fill
        unoptimized
        className={isMobileSheet ? "tw-object-cover" : "tw-object-contain"}
      />
    </div>
  ) : (
    <div
      className={
        isMobileSheet
          ? "tw-size-11 tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800"
          : "-tw-mt-1 tw-h-7 tw-w-7 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-700 tw-object-contain tw-ring-2 tw-ring-iron-900"
      }
    ></div>
  );

  if (isMobileSheet) {
    return (
      <GroupItemWrapper
        group={group}
        isActive={isActive}
        deactivateHover={deactivateHover}
        onActiveGroupId={onActiveGroupId}
        variant={variant}
      >
        <div className="tw-flex tw-min-h-[68px] tw-items-center tw-gap-3.5 tw-p-3">
          {profilePicture}
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
              <div className="tw-min-w-0 tw-flex-1">
                <span className="tw-block tw-truncate tw-pr-3 tw-text-xs tw-font-medium tw-text-iron-400">
                  {group.created_by.handle}
                </span>
                <div className="tw-mt-1 tw-flex tw-items-center tw-gap-2">
                  {isActive && (
                    <span className="tw-size-1.5 tw-flex-shrink-0 tw-rounded-full tw-bg-primary-400" />
                  )}
                  <p
                    className={`tw-mb-0 tw-truncate tw-text-sm tw-font-bold ${
                      isActive
                        ? "tw-text-iron-50"
                        : "tw-text-iron-100 group-hover:tw-text-iron-50"
                    }`}
                  >
                    {group.name}
                  </p>
                </div>
              </div>
              <div className="tw-flex tw-min-w-[4.5rem] tw-flex-shrink-0 tw-flex-col tw-items-end tw-gap-2">
                <span className="tw-whitespace-nowrap tw-text-[11px] tw-font-medium tw-text-iron-500">
                  {timeAgo}
                </span>
                {isActive && onActiveGroupId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deActivate();
                    }}
                    onMouseEnter={() => setDeactivateHover(true)}
                    onMouseLeave={() => setDeactivateHover(false)}
                    type="button"
                    className="tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-500/10 tw-text-primary-300 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-primary-500/20 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/30"
                  >
                    <span className="tw-sr-only">Remove</span>
                    <XMarkIcon className="tw-size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </GroupItemWrapper>
    );
  }

  return (
    <GroupItemWrapper
      group={group}
      isActive={isActive}
      deactivateHover={deactivateHover}
      onActiveGroupId={onActiveGroupId}
      variant={variant}
    >
      <div className="tw-relative -tw-mt-1 tw-flex tw-flex-col tw-rounded-b-xl tw-bg-iron-900">
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
              className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-p-1.5"
            >
              <span className="tw-sr-only">Remove</span>
              <XMarkIcon className="tw-h-4 tw-w-4 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-50" />
            </button>
          </div>
        )}
        <div className="tw-flex tw-h-full tw-flex-col">
          <div className="tw-flex tw-gap-x-3 tw-px-3">
            {profilePicture}
            <div className="tw-mt-1 tw-flex tw-w-full tw-items-center tw-justify-between tw-text-sm">
              <span className="tw-font-semibold tw-text-iron-50">
                <Link
                  href={`/${group.created_by?.handle}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="tw-group-hover:tw-text-iron-500 tw-text-sm tw-font-medium tw-text-iron-50 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-underline"
                >
                  {group.created_by?.handle}
                </Link>
              </span>
              <span className="tw-text-xs tw-font-normal tw-text-iron-400">
                {timeAgo}
              </span>
            </div>
          </div>
          <div className="tw-flex tw-h-full tw-flex-col tw-space-y-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-pb-3 tw-pt-3">
            <div className="tw-flex-1 tw-px-3">
              <p className="tw-text-overflow-ellipsis tw-mb-0 tw-overflow-hidden tw-truncate tw-whitespace-nowrap tw-text-base tw-font-semibold tw-text-iron-50">
                {group.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GroupItemWrapper>
  );
}
