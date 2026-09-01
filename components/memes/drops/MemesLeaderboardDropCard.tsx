import type { ReactNode } from "react";
import React from "react";

interface MemesLeaderboardDropCardProps {
  readonly children: ReactNode;
}

const MemesLeaderboardDropCard: React.FC<MemesLeaderboardDropCardProps> = ({
  children,
}) => {
  return (
    <div className="touch-select-none tw-w-full tw-rounded-xl tw-transition tw-duration-300 tw-ease-out">
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-border-white/10">
        {children}
      </div>
    </div>
  );
};

export default MemesLeaderboardDropCard;
