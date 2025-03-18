import { useMemo } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { calculateLastDecisionTime } from "../helpers/waves/time.utils";

export function useWave(wave: ApiWave | null | undefined) {


  // Extract time period boundaries or default to current time
  const participationStartTime =
    wave?.participation.period?.min ?? Time.currentMillis();
  const participationEndTime =
    wave?.participation.period?.max ?? Time.currentMillis();
  const votingStartTime = wave?.voting.period?.min ?? Time.currentMillis();
  const nominalVotingEndTime = wave?.voting.period?.max ?? Time.currentMillis();

  // Calculate the actual voting end time based on decision strategy
  const actualVotingEndTime = useMemo(
    () => calculateLastDecisionTime(wave),
    [
      wave?.wave.decisions_strategy?.first_decision_time,
      wave?.wave.decisions_strategy?.subsequent_decisions,
      wave?.wave.decisions_strategy?.is_rolling,
      nominalVotingEndTime,
    ]
  );

  return {
    voting: {
      startTime: votingStartTime,
      endTime: actualVotingEndTime,
    },
    participation: {
      startTime: participationStartTime,
      endTime: participationEndTime,
    },

    isMemesWave:
      wave?.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58",
  };
}
