import React from "react";
import WinnerDropBadge from "../../../waves/drops/winner/WinnerDropBadge";

interface MemeDropHeaderProps {
  readonly title: string;
  readonly rank: number | null;
  readonly decisionTime: number | null;
}

export default function MemeDropHeader({
  title,
  rank,
  decisionTime,
}: MemeDropHeaderProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-3">
      <WinnerDropBadge
        rank={rank}
        decisionTime={decisionTime}
      />
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
        {title}
      </h3>
    </div>
  );
}
