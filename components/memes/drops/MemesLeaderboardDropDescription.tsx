import React from "react";

interface MemesLeaderboardDropDescriptionProps {
  readonly description: string;
}

const MemesLeaderboardDropDescription: React.FC<
  MemesLeaderboardDropDescriptionProps
> = ({ description }) => {
  return (
    <div>
      <p className="tw-mb-0 tw-whitespace-pre-line tw-text-body tw-font-normal tw-text-iron-300">
        {description}
      </p>
    </div>
  );
};

export default MemesLeaderboardDropDescription;
