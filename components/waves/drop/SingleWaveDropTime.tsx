import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWave } from "../../../hooks/useWave";
import { CountdownDisplay } from "./CountdownDisplay";

interface SingleWaveDropTimeProps {
  readonly wave: ApiWave;
}

export const SingleWaveDropTime: React.FC<SingleWaveDropTimeProps> = ({ wave }) => {
  // Use our new unified hook for wave data
  const { voting } = useWave(wave);

  return (
    <div className="tw-relative">
      {voting.time.isUpcoming && (
        <CountdownDisplay
          headerText="Voting Starts In"
          timeRemaining={voting.time.timeLeft}
        />
      )}

      {voting.time.isInProgress && (
        <CountdownDisplay
          headerText="Voting Ends In"
          headerClassName="tw-text-sm tw-text-iron-400"
          timeRemaining={voting.time.timeLeft}
          hourLabel="Hours"
          minuteLabel="Minutes"
          secondsClassName="tw-text-xl tw-font-semibold tw-text-iron-100 tw-w-6"
        />
      )}

      {voting.time.isCompleted && (
        <div className="tw-text-sm tw-text-white/60 tw-bg-white/5 tw-rounded-lg tw-p-3 tw-text-center">
          The voting has ended
        </div>
      )}
    </div>
  );
}; 
