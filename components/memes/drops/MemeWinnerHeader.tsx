import React from "react";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

interface MemeWinnerHeaderProps {
  readonly title: string;
  readonly decisionTime?: number;
}

export default function MemeWinnerHeader({
  title,
  decisionTime,
}: MemeWinnerHeaderProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3 tw-items-start">
      <WinnerDropBadge rank={1} decisionTime={decisionTime || null} />
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
        {title}
      </h3>
    </div>
  );
}
