"use client";

import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { publicEnv } from "@/config/env";
import { getAppEnvironment } from "@/config/appEnvironment";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

interface EnvironmentBadgeProps {
  readonly compact?: boolean | undefined;
}

export default function EnvironmentBadge({
  compact = false,
}: EnvironmentBadgeProps) {
  const { badge, host } = getAppEnvironment(publicEnv.BASE_ENDPOINT);
  const tooltipId = buildTooltipId("environment-badge", useId());

  if (!badge) {
    return null;
  }

  const tooltipContent = `Environment: ${host}`;

  return (
    <>
      <span
        aria-label={`Environment: ${badge} (${host})`}
        className={`tw-inline-flex tw-min-w-0 tw-cursor-help tw-items-center tw-justify-center tw-gap-1 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-500/10 tw-font-mono tw-font-semibold tw-leading-none tw-text-amber-200 focus-visible:tw-outline focus-visible:tw-outline-1 focus-visible:tw-outline-amber-300 ${
          compact
            ? "tw-max-w-[4.75rem] tw-px-0.5 tw-py-1 tw-text-[10px]"
            : "tw-max-w-48 tw-px-1.5 tw-py-1 tw-text-xs"
        }`}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipContent}
        tabIndex={0}
      >
        {!compact && (
          <span
            aria-hidden="true"
            className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-amber-400"
          />
        )}
        <span className="tw-min-w-0 tw-truncate">{badge}</span>
      </span>
      <Tooltip
        id={tooltipId}
        place="right"
        style={TOOLTIP_STYLES}
      />
    </>
  );
}
