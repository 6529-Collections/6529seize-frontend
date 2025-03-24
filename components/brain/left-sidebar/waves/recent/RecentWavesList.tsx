import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { usePinnedWaves } from "../../../../../hooks/usePinnedWaves";
import { useWaveData } from "../../../../../hooks/useWaveData";
import BrainLeftSidebarWave from "../BrainLeftSidebarWave";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { EnhancedWave } from "../../../../../hooks/useWavesList";
interface RecentWavesListProps {
  readonly waves: EnhancedWave[];
}

const RecentWavesList: React.FC<RecentWavesListProps> = ({ waves }) => {
  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-px-5">
          <div className="tw-flex tw-justify-between tw-items-center">
            <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-200 tw-tracking-tight">
              Recent Waves
            </p>
          </div>
        </div>
        <div className="tw-mt-2 tw-max-h-96 tw-pb-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {waves.map((wave) => (
              <BrainLeftSidebarWave
                key={wave.id}
                wave={wave}
                newDropsCounts={{}}
                resetWaveCount={() => {}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentWavesList;
