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
    <div className="tw-flex tw-items-center tw-justify-start tw-gap-x-3">
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
