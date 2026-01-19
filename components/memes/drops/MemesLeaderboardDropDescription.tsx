import React from "react";

interface MemesLeaderboardDropDescriptionProps {
  readonly description: string;
}

const MemesLeaderboardDropDescription: React.FC<
  MemesLeaderboardDropDescriptionProps
> = ({ description }) => {
  return (
    <div>
      <p className="tw-mb-0 tw-whitespace-pre-line tw-text-sm tw-leading-relaxed tw-text-iron-500">
        {description}
      </p>
    </div>
  );
};

export default MemesLeaderboardDropDescription;
