import React from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";

interface UnifiedWavesListEmptyProps {
  readonly sortedWaves: MinimalWave[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly emptyMessage?: string;
}

const UnifiedWavesListEmpty: React.FC<UnifiedWavesListEmptyProps> = ({
  sortedWaves,
  isFetching,
  isFetchingNextPage,
  emptyMessage,
}) => {
  if (sortedWaves.length > 0 || isFetching || isFetchingNextPage) {
    return null;
  }

  return (
    <div className="tw-px-5 tw-py-8 tw-text-center tw-text-iron-500">
      <p>{emptyMessage ?? "No waves to display"}</p>
    </div>
  );
};

export default UnifiedWavesListEmpty;
