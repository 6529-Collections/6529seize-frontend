"use client";

import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  getAppEnvironment,
  getBrowserOrigin,
  PRODUCTION_APP_ORIGIN,
} from "@/config/appEnvironment";
import { useId, useSyncExternalStore } from "react";
import { Tooltip } from "react-tooltip";

interface EnvironmentBadgeProps {
  readonly compact?: boolean | undefined;
}

const subscribeToBrowserOrigin = () => () => undefined;
const getServerOriginSnapshot = () => PRODUCTION_APP_ORIGIN;

export default function EnvironmentBadge({
  compact = false,
}: EnvironmentBadgeProps) {
  const browserOrigin = useSyncExternalStore(
    subscribeToBrowserOrigin,
    getBrowserOrigin,
    getServerOriginSnapshot
  );
  const { badge, host } = getAppEnvironment(browserOrigin);
  const tooltipId = buildTooltipId("environment-badge", useId());

  if (!badge) {
    return null;
  }

  const tooltipContent = `Environment: ${host}`;

  return (
    <>
      <span
        aria-label={`Environment: ${badge} (${host})`}
        className={`tw-inline-flex tw-min-w-0 tw-cursor-help tw-items-center tw-justify-center tw-gap-1 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-500/10 tw-font-mono tw-font-semibold tw-text-amber-200 ${
          compact
            ? "tw-max-w-[4.75rem] tw-px-0.5 tw-py-1 tw-text-[11px] tw-leading-4"
            : "tw-max-w-48 tw-px-1.5 tw-py-1 tw-text-xs tw-leading-none"
        }`}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipContent}
      >
        {!compact && (
          <span
            aria-hidden="true"
            className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-amber-400"
          />
        )}
        <span className="tw-min-w-0 tw-truncate">{badge}</span>
      </span>
      <Tooltip id={tooltipId} place="right" style={TOOLTIP_STYLES} />
    </>
  );
}
