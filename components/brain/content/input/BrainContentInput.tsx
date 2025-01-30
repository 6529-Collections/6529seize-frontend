import React, { useMemo } from "react";
import { useWaveData } from "../../../../hooks/useWaveData";
import useCapacitor from "../../../../hooks/useCapacitor";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import PrivilegedDropCreator, {
  DropMode,
} from "../../../waves/PrivilegedDropCreator";

interface BrainContentInputProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly waveId?: string;
}

const BrainContentInput: React.FC<BrainContentInputProps> = ({
  activeDrop,
  onCancelReplyQuote,
  waveId,
}) => {
  const capacitor = useCapacitor();
  const { data: wave } = useWaveData(activeDrop?.drop.wave?.id ?? null);
  const containerClassName = useMemo(() => {
    return capacitor.isCapacitor
      ? "tw-max-h-[calc(100vh-14.7rem)]"
      : "tw-max-h-[calc(100vh-20rem)] lg:tw-max-h-[calc(100vh-20rem)]";
  }, [capacitor.isCapacitor]);
  if (!wave) return null;

  return (
    <div
      className={`${containerClassName} tw-w-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-sticky tw-top-0 tw-z-30 tw-flex-none tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-2 md:tw-p-4 tw-shadow-lg`}
    >
      <PrivilegedDropCreator
        wave={wave}
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
        onAllDropsAdded={onCancelReplyQuote}
        onDropAddedToQueue={() => {}}
        key={wave.id}
        dropId={null}
        fixedDropMode={DropMode.BOTH}
      />
    </div>
  );
};

export default BrainContentInput;
