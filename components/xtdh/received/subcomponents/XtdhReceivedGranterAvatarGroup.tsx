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
  readonly onClick?: () => void;
  readonly ariaLabel?: string;
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
  onClick,
  ariaLabel,
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

  const interactive = typeof onClick === "function";
  const RootComponent = (interactive ? "button" : "div") as
    | "button"
    | "div";
  const rootClassName = clsx(
    "tw-inline-flex tw-items-center tw-gap-2",
    interactive
      ? "tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900/40 tw-px-2.5 tw-py-1.5 tw-text-left tw-transition tw-duration-200 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-900/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      : undefined,
    className,
  );

  const commonProps = interactive
    ? {
        type: "button" as const,
        onClick,
        "aria-label": ariaLabel ?? srLabel,
      }
    : {};

  if (preview.length > 0) {
    return (
      <RootComponent className={rootClassName} {...commonProps}>
        <span className="tw-inline-flex -tw-space-x-2" aria-hidden="true">
          {preview.map((granter) => (
            <CustomTooltip
              key={granter.profileId}
              content={granter.displayName}
              placement="top"
            >
              <img
                src={granter.profileImage}
                alt=""
                className="tw-h-7 tw-w-7 tw-rounded-full tw-border tw-border-iron-950 tw-bg-iron-900 tw-object-cover"
                loading="lazy"
              />
            </CustomTooltip>
          ))}
          {additional > 0 && (
            <CustomTooltip
              content={`and ${additional.toLocaleString()} more grantor${additional === 1 ? "" : "s"}`}
              placement="top"
            >
              <span className="tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-950 tw-bg-iron-900 tw-text-xxs tw-font-semibold tw-leading-none tw-text-iron-200">
                +{additional.toLocaleString()}
              </span>
            </CustomTooltip>
          )}
        </span>
        {showCountLabel && (
          <span className="tw-text-xs tw-text-iron-300">
            {formatGrantorCount(overallCount)}
          </span>
        )}
        <span className="tw-sr-only">{srLabel}</span>
      </RootComponent>
    );
  }

  if (overallCount <= 0) {
    return (
      <RootComponent
        className={clsx(rootClassName, "tw-text-xs tw-text-iron-400")}
        {...commonProps}
      >
        No grantors yet
      </RootComponent>
    );
  }

  return (
    <RootComponent className={rootClassName} {...commonProps}>
      <span className="tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-950 tw-bg-iron-900">
        <FontAwesomeIcon icon={faUserGroup} className="tw-h-3 tw-w-3 tw-text-iron-300" />
      </span>
      <span className="tw-text-xs tw-text-iron-300">{formatGrantorCount(overallCount)}</span>
    </RootComponent>
  );
}
