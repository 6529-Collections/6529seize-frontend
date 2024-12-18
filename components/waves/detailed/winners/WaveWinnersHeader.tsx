import React from "react";

interface WaveWinnersHeaderProps {
  readonly wave: any;
}

export const WaveWinnersHeader: React.FC<WaveWinnersHeaderProps> = ({
  wave,
}) => {
  return (
    <div className="tw-text-center">
    <h2 className="tw-text-2xl tw-font-bold tw-text-iron-100">
      Wave Winners
    </h2>
    <p className="tw-mt-2 tw-text-sm tw-text-iron-400">Lorem ipsum dolor sit amet consectetur</p>
  </div>
  );
};
