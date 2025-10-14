'use client';

import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";

import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { XtdhGranter } from "@/types/xtdh";

const MAX_PREVIEW_AVATARS = 4;

export interface XtdhReceivedGranterAvatarGroupProps {
  readonly granters: XtdhGranter[];
  readonly totalCount?: number;
  readonly className?: string;
  readonly showCountLabel?: boolean;
}

function formatGrantorCount(count: number) {
  const formatted = count.toLocaleString();
  return `${formatted} grantor${count === 1 ? "" : "s"}`;
}

export function XtdhReceivedGranterAvatarGroup({
  granters,
  totalCount,
  className,
  showCountLabel = false,
}: XtdhReceivedGranterAvatarGroupProps) {
  const displayable = granters.filter(
    (granter) => Boolean(granter.profileImage) && Boolean(granter.displayName),
  );

  const preview = displayable.slice(0, MAX_PREVIEW_AVATARS);
  const overallCount = typeof totalCount === "number" ? totalCount : granters.length;
  const additional = Math.max(overallCount - preview.length, 0);

  const srLabel =
    overallCount > 0
      ? formatGrantorCount(overallCount)
      : "No grantors yet";

  if (preview.length > 0) {
    return (
      <div className={clsx("tw-flex tw-items-center tw-gap-2", className)}>
        <div className="tw-flex -tw-space-x-2" aria-hidden="true">
          {preview.map((granter) => (
            <CustomTooltip
              key={granter.profileId}
              content={granter.displayName}
              placement="top"
            >
              <img
                src={granter.profileImage}
                alt=""
                className="tw-h-7 tw-w-7 tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900 tw-object-cover"
                loading="lazy"
              />
            </CustomTooltip>
          ))}
          {additional > 0 && (
            <span className="tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900 tw-text-xxs tw-font-semibold tw-text-iron-200">
              +{additional.toLocaleString()}
            </span>
          )}
        </div>
        {showCountLabel && (
          <span className="tw-text-xs tw-text-iron-300">
            {formatGrantorCount(overallCount)}
          </span>
        )}
        <span className="tw-sr-only">{srLabel}</span>
      </div>
    );
  }

  if (overallCount <= 0) {
    return (
      <div className={clsx("tw-text-xs tw-text-iron-400", className)}>
        No grantors yet
      </div>
    );
  }

  return (
    <div className={clsx("tw-inline-flex tw-items-center tw-gap-2", className)}>
      <span className="tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900">
        <FontAwesomeIcon icon={faUserGroup} className="tw-h-3 tw-w-3 tw-text-iron-300" />
      </span>
      <span className="tw-text-xs tw-text-iron-300">{formatGrantorCount(overallCount)}</span>
    </div>
  );
}
