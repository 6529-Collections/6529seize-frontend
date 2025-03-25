import React from "react";

interface MemesLeaderboardDropDescriptionProps {
  readonly description: string;
}

export const MemesLeaderboardDropDescription: React.FC<MemesLeaderboardDropDescriptionProps> = ({
  description,
}) => {
  return (
    <div>
      <p className="tw-text-iron-400 tw-mb-0">{description}</p>
    </div>
  );
};

export default MemesLeaderboardDropDescription;