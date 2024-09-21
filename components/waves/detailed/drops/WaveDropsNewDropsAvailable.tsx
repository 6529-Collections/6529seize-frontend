import React from 'react';

interface WaveDropsNewDropsAvailableProps {
  readonly haveNewDrops: boolean;
  readonly onRefresh: () => void;
}

export const WaveDropsNewDropsAvailable: React.FC<WaveDropsNewDropsAvailableProps> = ({
  haveNewDrops,
  onRefresh,
}) => {
  if (!haveNewDrops) return null;

  return (
    <div className="tw-absolute tw-top-2 tw-left-1/2 tw-transform -tw-translate-x-1/2 tw-z-50">
      <button
        onClick={onRefresh}
        type="button"
        className="tw-border-none tw-bg-primary-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md tw-cursor-pointer tw-transition-all hover:tw-bg-primary-600 tw-text-xs tw-font-medium"
      >
        New drops available
      </button>
    </div>
  );
};