import React from "react";

interface MemesLeaderboardDropHeaderProps {
  readonly title: string;
  readonly rank: number | null;
  readonly decisionTime: number | null;
}

export const MemesLeaderboardDropHeader: React.FC<
  MemesLeaderboardDropHeaderProps
> = ({ title }) => {
  return (
    <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
      {title}
    </h3>
  );
};

export default MemesLeaderboardDropHeader;
