"use client";

import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useId, type MouseEvent } from "react";
import { Tooltip } from "react-tooltip";

const ADDITIONAL_ACTION_PROMISE_LABEL = t(
  DEFAULT_LOCALE,
  "drops.additionalActionBadge.label"
);

const ADDITIONAL_ACTION_PROMISE_TOOLTIP = t(
  DEFAULT_LOCALE,
  "drops.additionalActionBadge.tooltip"
);

const BADGE_CLASSES =
  "tw-inline-flex tw-shrink-0 tw-self-center tw-cursor-help tw-items-center tw-rounded-full tw-bg-amber-400/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-leading-5 tw-text-amber-300 tw-ring-1 tw-ring-amber-300/25 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-amber-300";

interface AdditionalActionPromiseBadgeProps {
  readonly className?: string | undefined;
  readonly focusable?: boolean | undefined;
}

function stopBadgeClickPropagation(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

export function AdditionalActionPromiseBadge({
  className = "",
  focusable = true,
}: AdditionalActionPromiseBadgeProps) {
  const badgeClassName = `${BADGE_CLASSES} ${className}`;
  const descriptionId = useId();
  const tooltipId = buildTooltipId("additional-action", descriptionId);

  return (
    <>
      {focusable ? (
        <button
          type="button"
          aria-describedby={descriptionId}
          data-tooltip-id={tooltipId}
          onClick={stopBadgeClickPropagation}
          className={`${badgeClassName} tw-border-0`}
        >
          {ADDITIONAL_ACTION_PROMISE_LABEL}
        </button>
      ) : (
        <span
          aria-describedby={descriptionId}
          data-tooltip-id={tooltipId}
          className={badgeClassName}
        >
          {ADDITIONAL_ACTION_PROMISE_LABEL}
        </span>
      )}
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        delayShow={200}
        positionStrategy="fixed"
        globalCloseEvents={{ escape: true, scroll: true }}
        style={TOOLTIP_STYLES}
        className="tw-max-w-[min(20rem,calc(100vw-2rem))] tw-whitespace-normal tw-text-left tw-leading-5"
      >
        {ADDITIONAL_ACTION_PROMISE_TOOLTIP}
      </Tooltip>
      <span id={descriptionId} className="tw-sr-only">
        {ADDITIONAL_ACTION_PROMISE_TOOLTIP}
      </span>
    </>
  );
}
