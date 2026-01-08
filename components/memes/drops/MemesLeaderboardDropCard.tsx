import type { ReactNode } from "react";
import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemesLeaderboardDropCardProps {
  readonly drop: ExtendedDrop;
  readonly children: ReactNode;
}

const getBorderClasses = (drop: ExtendedDrop) => {
  const rank = drop.rank && drop.rank <= 3 ? drop.rank : null;

  const baseClasses =
    "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

  if (rank === 1) {
    return `${baseClasses} desktop-hover:hover:tw-border-yellow-500/20`;
  } else if (rank === 2) {
    return `${baseClasses} desktop-hover:hover:tw-border-iron-400/25`;
  } else if (rank === 3) {
    return `${baseClasses} desktop-hover:hover:tw-border-amber-600/20`;
  } else {
    // More subtle hover effect for ranks 4+
    return `${baseClasses} desktop-hover:hover:tw-border-iron-700`;
  }
};

const MemesLeaderboardDropCard: React.FC<MemesLeaderboardDropCardProps> = ({
  drop,
  children,
}) => {
  const borderClasses = getBorderClasses(drop);

  return (
    <div className="touch-select-none tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full">
      <div className={`${borderClasses} tw-bg-iron-950`}>
        {children}
      </div>
    </div>
  );
};

export default MemesLeaderboardDropCard;