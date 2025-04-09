import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";

interface DropVoteProgressingProps {
  readonly current: number | null | undefined;
  readonly projected: number | null | undefined;
}

export default function DropVoteProgressing({
  current,
  projected,
}: DropVoteProgressingProps): React.ReactElement | null {
  if (typeof current !== "number" || typeof projected !== "number") {
    return null;
  }

  const isProgressing = current !== projected;

  if (!isProgressing) {
    return null;
  }

  const isPositiveProgressing = current < projected;
  const color = isPositiveProgressing
    ? "tw-text-emerald-400 tw-bg-emerald-950/40"
    : "tw-text-rose-400 tw-bg-rose-950/40";

  return (
    <Tippy
      content={`Projected vote count at decision time: ${formatNumberWithCommas(
        projected
      )}`}
    >
      <span
        className={`${color} tw-text-xs tw-font-medium tw-animate-pulse tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-sm tw-flex tw-items-center tw-gap-x-1`}
        style={{
          animationDuration: "2s",
        }}
      >
        <FontAwesomeIcon
          icon={faArrowRight}
          className="tw-flex-shrink-0 tw-size-3"
        />
        <span>{formatNumberWithCommas(projected)}</span>
      </span>
    </Tippy>
  );
}
