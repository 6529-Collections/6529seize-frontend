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
    <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-pt-16 tw-px-4 tw-bg-iron-950/60">
      <div className="tw-grid tw-grid-cols-3 tw-gap-x-4 tw-max-w-3xl tw-mx-auto tw-items-end">
        <PodiumPlaceholderCard height="tw-h-[190px]" />
        <PodiumPlaceholderCard height="tw-h-[220px]" />
        <PodiumPlaceholderCard height="tw-h-[170px]" />
      </div>
    </div>
  );
};