import React from "react";

interface MemesLeaderboardDropHeaderProps {
  readonly title: string;
}

const MemesLeaderboardDropHeader: React.FC<
  MemesLeaderboardDropHeaderProps
> = ({ title }) => {
  return (
    <h3 className="tw-mb-0 tw-mt-0 tw-text-lg tw-font-bold tw-leading-tight tw-text-white">
      {title}
    </h3>
  );
};

export default MemesLeaderboardDropHeader;
