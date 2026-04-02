import type { ReactNode } from "react";
import React from "react";
import { getRankHoverBorderClass } from "@/components/waves/drops/dropRankStyles";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemesLeaderboardDropCardProps {
  readonly drop: ExtendedDrop;
  readonly children: ReactNode;
}

const getBorderClasses = (drop: ExtendedDrop) => {
  const rank =
    typeof drop.rank === "number" && drop.rank <= 3 ? drop.rank : null;

  const baseClasses =
    "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

  if (rank === 1) {
    return `${baseClasses} ${getRankHoverBorderClass(1)}`;
  }

  if (rank === 2) {
    return `${baseClasses} ${getRankHoverBorderClass(2)}`;
  }

  if (rank === 3) {
    return `${baseClasses} ${getRankHoverBorderClass(3)}`;
  }

  return `${baseClasses} desktop-hover:hover:tw-border-iron-700`;
};

const MemesLeaderboardDropCard: React.FC<MemesLeaderboardDropCardProps> = ({
  drop,
  children,
}) => {
  const borderClasses = getBorderClasses(drop);

  return (
    <div className="touch-select-none tw-w-full tw-rounded-xl tw-transition tw-duration-300 tw-ease-out">
      <div className={`${borderClasses} tw-bg-iron-950`}>{children}</div>
    </div>
  );
};

export default MemesLeaderboardDropCard;
