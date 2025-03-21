import React from "react";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

interface MemesLeaderboardDropHeaderProps {
  readonly title: string;
  readonly rank: number | null;
  readonly decisionTime: number | null;
}

export const MemesLeaderboardDropHeader: React.FC<MemesLeaderboardDropHeaderProps> = ({
  title,
  rank,
  decisionTime,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-3 sm:tw-gap-y-2">
      <WinnerDropBadge
        rank={rank}
        decisionTime={decisionTime || null}
      />
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
        {title}
      </h3>
    </div>
  );
};

export default MemesLeaderboardDropHeader;
