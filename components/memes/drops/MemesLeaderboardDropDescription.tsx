import React from "react";

interface MemesLeaderboardDropDescriptionProps {
  readonly description: string;
}

const MemesLeaderboardDropDescription: React.FC<MemesLeaderboardDropDescriptionProps> = ({
  description,
}) => {
  return (
    <div>
      <p className="tw-text-sm tw-text-iron-500 tw-mb-0 tw-leading-relaxed">{description}</p>
    </div>
  );
};

export default MemesLeaderboardDropDescription;