import React from "react";
import { WaveRollingWinnersLoadingItem } from "./WaveRollingWinnersLoadingItem";

export const WaveRollingWinnersLoading: React.FC = () => {
  // Create an array to simulate multiple decision points (3 placeholders)
  const placeholders = Array.from({ length: 3 });
  
  // In loading state, only the first item is expanded
  const expandedIndex = 0;

  return (
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-none">
      {placeholders.map((_, index) => (
        <WaveRollingWinnersLoadingItem
          key={`skeleton-${index}`}
          index={index}
          isExpanded={index === expandedIndex} // Only the expandedIndex item is open
        />
      ))}
    </div>
  );
};