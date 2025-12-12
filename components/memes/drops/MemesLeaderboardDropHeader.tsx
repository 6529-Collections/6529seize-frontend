import React from "react";

interface MemesLeaderboardDropHeaderProps {
  readonly title: string;
}

const MemesLeaderboardDropHeader: React.FC<
  MemesLeaderboardDropHeaderProps
> = ({ title }) => {
  return (
    <h3 className="tw-text-lg tw-font-bold tw-text-white tw-mb-0 tw-leading-tight">
      {title}
    </h3>
  );
};

export default MemesLeaderboardDropHeader;
