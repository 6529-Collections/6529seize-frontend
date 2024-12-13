import React from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { useWaveData } from "../../../hooks/useWaveData";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
  readonly waveId: string | null;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  showPinnedWaves = true,
  waveId,
  activeDrop,
  onCancelReplyQuote,
}) => {
  const { data: wave } = useWaveData(waveId);

  return (
    <div className="tw-pr-2">
      {showPinnedWaves && <BrainContentPinnedWaves />}
      <BrainContentInput
        waveId={waveId}
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
      />
      <div className="tw-flex-1">
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-2 tw-mt-2">
          {!!wave && (
            <>
              <h2 className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-200">
                <span>{wave.name}</span>{" "}
                <span className="tw-text-iron-400">Stream</span>
              </h2>
              <div className="tw-flex-1 tw-h-px tw-bg-iron-900" />
              {/* <FilterDrops /> */}
            </>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
