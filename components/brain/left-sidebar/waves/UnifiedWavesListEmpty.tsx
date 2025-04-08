import React from "react";
import { MinimalWave } from "../../../../contexts/wave/MyStreamContext";

interface UnifiedWavesListEmptyProps {
  readonly sortedWaves: MinimalWave[];
  readonly isFetchingNextPage: boolean;
}

const UnifiedWavesListEmpty: React.FC<UnifiedWavesListEmptyProps> = ({
  sortedWaves,
  isFetchingNextPage,
}) => {
  if (sortedWaves.length > 0 || isFetchingNextPage) {
    return null;
  }

  return (
    <div className="tw-px-5 tw-py-8 tw-text-center tw-text-iron-500">
      <p>No waves to display</p>
    </div>
  );
};

export default UnifiedWavesListEmpty;
