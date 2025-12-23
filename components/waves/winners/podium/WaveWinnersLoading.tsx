import React from "react";

const PodiumPlaceholderCard = ({ height }: { height: string }) => (
  <div className="tw-relative">
    <div className="tw-absolute tw-left-1/2 -tw-translate-x-1/2 -tw-top-6 tw-z-10">
      <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-iron-800/80 tw-animate-pulse" />
    </div>
    <div
      className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full ${height} tw-bg-iron-900/80 tw-rounded-xl tw-border tw-border-iron-800/60 tw-backdrop-blur-xl tw-pt-8`}
    >
      <div className="tw-w-24 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
      <div className="tw-w-20 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
      <div className="tw-w-16 tw-h-4 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
    </div>
  </div>
);

export const WaveWinnersLoading: React.FC = () => {
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-items-end tw-px-4 tw-pb-4 tw-pt-8">
      <PodiumPlaceholderCard height="tw-h-32" />
      <PodiumPlaceholderCard height="tw-h-40" />
      <PodiumPlaceholderCard height="tw-h-28" />
    </div>
  );
};
