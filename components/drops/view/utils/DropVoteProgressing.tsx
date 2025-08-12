import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { Tooltip } from "react-tooltip";

interface DropVoteProgressingProps {
  readonly current: number | null | undefined;
  readonly projected: number | null | undefined;
  readonly subtle?: boolean;
}

export default function DropVoteProgressing({
  current,
  projected,
  subtle = false,
}: DropVoteProgressingProps): React.ReactElement<any> | null {
  if (typeof current !== "number" || typeof projected !== "number") {
    return null;
  }

  const isProgressing = current !== projected;

  if (!isProgressing) {
    return null;
  }

  const isPositiveProgressing = current < projected;

  // Define styles based on subtle mode
  let color;
  if (subtle) {
    color = isPositiveProgressing
      ? "tw-text-iron-300 tw-bg-iron-700 tw-transition-colors tw-duration-200"
      : "tw-text-iron-400 tw-bg-iron-700 tw-transition-colors tw-duration-200";
  } else {
    color = isPositiveProgressing
      ? "tw-text-emerald-400 tw-bg-emerald-900/40"
      : "tw-text-rose-400 tw-bg-rose-900/40";
  }

  return (
    <>
      <span
        className={`${color} tw-text-sm tw-font-medium tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1`}
        style={{
          animationDuration: "2s",
        }}
        data-tooltip-id={`drop-vote-progress-${current}-${projected}`}
      >
        <FontAwesomeIcon
          icon={faArrowRight}
          className="tw-flex-shrink-0 tw-size-3"
        />
        <span>{formatNumberWithCommas(projected)}</span>
      </span>
      <Tooltip
        id={`drop-vote-progress-${current}-${projected}`}
        place="top"
        positionStrategy="absolute"
        opacity={1}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
          zIndex: 50,
          boxShadow:
            "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
        }}
      >
        <span className="tw-text-xs">
          Projected vote count at decision time:{" "}
          {formatNumberWithCommas(projected)}
        </span>
      </Tooltip>
    </>
  );
}
