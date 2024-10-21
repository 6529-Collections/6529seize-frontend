import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useWaveData } from "../../../../hooks/useWaveData";
import CreateDrop from "../../../waves/detailed/CreateDrop";
import useCapacitor from "../../../../hooks/useCapacitor";

interface BrainContentInputProps {}

const BrainContentInput: React.FC<BrainContentInputProps> = () => {
  const router = useRouter();
  const waveId = router.query.wave as string;
  const capacitor = useCapacitor();
  const { data: wave } = useWaveData(waveId);
  // TODO: Correct heights
  const containerClassName = useMemo(() => {
    return capacitor.isCapacitor
      ? "tw-max-h-[calc(100vh-14.7rem)]"
      : "tw-max-h-[calc(100vh-20rem)] lg:tw-max-h-[calc(100vh-20rem)]";
  }, [capacitor.isCapacitor]);
  if (!wave) return null;

  return (
    <div
      className={`${containerClassName} tw-overflow-y-auto tw-w-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-sticky tw-top-0 tw-z-30 tw-flex-none tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-4 tw-shadow-lg`}
    >
      <CreateDrop
        wave={wave}
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        key={wave.id}
      />
    </div>
  );
};

export default BrainContentInput;
