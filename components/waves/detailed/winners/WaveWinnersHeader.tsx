import React from "react";

interface WaveWinnersHeaderProps {
  readonly wave: any;
}

export const WaveWinnersHeader: React.FC<WaveWinnersHeaderProps> = ({
  wave,
}) => {
  return (
    <div className="tw-text-center">
      <div className="tw-relative tw-inline-block">
        <div className="tw-absolute -tw-inset-1 tw-bg-gradient-to-r tw-from-iron-300 tw-via-iron-200 tw-to-iron-300 tw-rounded-lg tw-blur-lg tw-opacity-10"></div>
        <h2 className="tw-mb-0 tw-relative tw-text-3xl tw-font-extrabold tw-bg-clip-text tw-text-transparent tw-bg-gradient-to-r tw-from-iron-100 tw-via-white tw-to-iron-100">
          Wave Winners
        </h2>
      </div>
      <p className="tw-mt-4 tw-text-iron-400 tw-text-sm tw-max-w-md tw-mx-auto">
        Celebrating the most impactful contributors in this wave
      </p>
    </div>
  );
};
