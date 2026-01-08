import { formatNumberWithCommas } from "@/helpers/Helpers";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactElement } from "react";
import { Tooltip } from "react-tooltip";

interface DropVoteProgressingProps {
  readonly current: number | null | undefined;
  readonly projected: number | null | undefined;
  readonly subtle?: boolean | undefined;
}

export default function DropVoteProgressing({
  current,
  projected,
  subtle = false,
}: DropVoteProgressingProps): ReactElement | null {
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
      ? "tw-text-emerald-500 tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-emerald-500/20 tw-font-mono"
      : "tw-text-rose-500 tw-bg-rose-500/10 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-rose-500/20 tw-font-mono";
    arrowColor = "tw-text-iron-600";
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
        <span className={`tw-text-sm tw-font-medium tw-tracking-tight ${color}`}>{formatNumberWithCommas(projected)}</span>
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
