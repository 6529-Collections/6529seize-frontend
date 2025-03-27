import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { CountdownDisplay } from "./CountdownDisplay";
import { useWaveTimers } from "../../../hooks/useWaveTimers";

interface SingleWaveDropTimeProps {
  readonly wave: ApiWave;
}

export const SingleWaveDropTime: React.FC<SingleWaveDropTimeProps> = ({
  wave,
}) => {
  const {
    voting: { timeLeft, isUpcoming, isCompleted },
  } = useWaveTimers(wave);

  // If voting is completed, just show the completion message
  if (isCompleted) {
    return (
      <div className="tw-relative">
        <div className="tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-3 tw-text-center">
          The voting has ended
        </div>
      </div>
    );
  }

  // For both upcoming and in-progress states, use the same CountdownDisplay
  // with dynamic props based on the phase
  return (
    <div className="tw-relative tw-pt-4">
      <CountdownDisplay
        headerText={isUpcoming ? "Voting Starts In" : "Voting Ends In"}
        headerClassName="tw-text-sm tw-text-iron-400"
        timeRemaining={timeLeft}
        hourLabel="Hours"
        minuteLabel="Minutes"
        secondsClassName="tw-text-xl tw-font-semibold tw-text-iron-100 tw-w-6"
      />
    </div>
  );
};
