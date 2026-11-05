"use client";

import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  getAppEnvironment,
  getBrowserOrigin,
  getConfiguredAppOrigin,
  isLocalAppEnvironment,
} from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { useId, useSyncExternalStore } from "react";
import { Tooltip } from "react-tooltip";

interface EnvironmentBadgeProps {
  readonly compact?: boolean | undefined;
  readonly logoOverlay?: boolean | undefined;
}

const subscribeToBrowserOrigin = () => () => undefined;
// Each deployment is built for one host (BASE_ENDPOINT), so the server HTML of
// every page, prerendered or not, carries that host's badge without reading
// the request. A browser on another host, such as a local server on a
// different port, shows its own badge right after hydration.
const getConfiguredOrigin = () =>
  getConfiguredAppOrigin(publicEnv.BASE_ENDPOINT);

export default function EnvironmentBadge({
  compact = false,
  logoOverlay = false,
}: EnvironmentBadgeProps) {
  const browserOrigin = useSyncExternalStore(
    subscribeToBrowserOrigin,
    getBrowserOrigin,
    getConfiguredOrigin
  );
  const { badge, host } = getAppEnvironment(browserOrigin);
  const tooltipId = buildTooltipId("environment-badge", useId());

  if (!badge) {
    return null;
  }

  const tooltipContent = `Environment: ${host}`;

  if (logoOverlay) {
    const localPort = isLocalAppEnvironment(browserOrigin)
      ? new URL(browserOrigin).port
      : undefined;

    return (
      <span
        role="img"
        aria-label={`Environment: ${badge} (${host})`}
        className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-flex tw-max-w-[4.75rem] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-select-none tw-flex-col tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded tw-border tw-border-solid tw-border-[#a17c27] tw-bg-[#191405] tw-px-1 tw-py-0.5 tw-font-mono tw-text-[11px] tw-font-semibold tw-leading-[14px] tw-text-amber-200"
      >
        <span className="tw-max-w-full tw-truncate">
          {localPort ? "LCL" : badge}
        </span>
        {localPort && <span>{localPort}</span>}
      </span>
    );
  }

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
