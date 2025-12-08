import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatNumberWithCommas } from "@/helpers/Helpers";
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

  let color: string;
  let arrowColor: string;
  if (subtle) {
    color = isPositiveProgressing ? "tw-text-iron-400 tw-font-mono" : "tw-text-iron-600 tw-font-mono";
    arrowColor = "tw-text-iron-600";
  } else {
    color = isPositiveProgressing
      ? "tw-text-emerald-400 tw-bg-emerald-900/40 tw-px-1.5 tw-py-0.5 tw-rounded-md"
      : "tw-text-rose-400 tw-bg-rose-900/40 tw-px-1.5 tw-py-0.5 tw-rounded-md";
    arrowColor = isPositiveProgressing ? "tw-text-emerald-400" : "tw-text-rose-400";
  }

  return (
    <>
      <span
        className={`tw-flex tw-items-center tw-gap-2 ${subtle ? '' : 'tw-ml-0.5'}`}
        style={{
          animationDuration: "2s",
        }}
        data-tooltip-id={`drop-vote-progress-${current}-${projected}`}
      >
        <FontAwesomeIcon
          icon={faArrowRight}
          className={`tw-flex-shrink-0 tw-size-2.5 ${arrowColor}`}
        />
        <span className={`tw-text-xs tw-font-medium ${color}`}>{formatNumberWithCommas(projected)}</span>
      </span>
      <Tooltip
        id={`drop-vote-progress-${current}-${projected}`}
        place="top"
        offset={8}
        opacity={1}
        style={{
          padding: "4px 8px",
          background: "#37373E",
          color: "white",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        Projected vote count at decision time:{" "}
        {formatNumberWithCommas(projected)}
      </Tooltip>
    </>
  );
}
