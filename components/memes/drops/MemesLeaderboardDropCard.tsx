import React, { ReactNode } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface MemesLeaderboardDropCardProps {
  readonly drop: ExtendedDrop;
  readonly children: ReactNode;
}

const getBorderClasses = (drop: ExtendedDrop) => {
  const rank = drop.rank && drop.rank <= 3 ? drop.rank : null;

  const baseClasses =
    "tw-rounded-xl tw-border tw-border-solid tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

  if (rank === 1) {
    return `${baseClasses} tw-border-[#fbbf24]/30`;
  } else if (rank === 2) {
    return `${baseClasses} tw-border-[#94a3b8]/30`;
  } else if (rank === 3) {
    return `${baseClasses} tw-border-[#CD7F32]/30`;
  } else {
    return `${baseClasses} tw-border-iron-800/50`;
  }
};

export const MemesLeaderboardDropCard: React.FC<MemesLeaderboardDropCardProps> = ({
  drop,
  children,
}) => {
  const borderClasses = getBorderClasses(drop);

  return (
    <div className="tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full">
      <div className={`${borderClasses} tw-bg-iron-950`}>
        {children}
      </div>
    </div>
  );
};

export default MemesLeaderboardDropCard;