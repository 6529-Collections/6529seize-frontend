import { useId, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

import { INFO_TOOLTIP_STYLE } from "./constants";

interface InfoTooltipProps {
  readonly tooltip: ReactNode;
  readonly ariaLabel?: string;
  readonly iconClassName?: string;
}

export function InfoTooltip({
  tooltip,
  ariaLabel = "More information",
  iconClassName,
}: Readonly<InfoTooltipProps>) {
  const tooltipId = useId().replace(/:/g, "");

  return (
    <>
      <span
        className={`tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-text-iron-300 hover:tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0 ${
          iconClassName ?? ""
        }`}
        data-tooltip-id={tooltipId}
        data-tooltip-place="top"
        data-tooltip-offset={10}
        data-tooltip-delay-show={150}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <FontAwesomeIcon icon={faInfoCircle} className="tw-h-4 tw-w-4" />
      </span>
      <Tooltip id={tooltipId} style={INFO_TOOLTIP_STYLE}>
        {tooltip}
      </Tooltip>
    </>
  );
}
