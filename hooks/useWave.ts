import { useMemo } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { calculateLastDecisionTime } from "../helpers/waves/time.utils";
import { isMemesWave } from "../helpers/waves/waves.helpers";

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
    decisions: {
      multiDecision:
        !!wave?.wave.decisions_strategy?.subsequent_decisions.length,
    },
    isChatWave: wave?.wave.type === "CHAT",
    isRankWave: wave?.wave.type === "RANK",
    isMemesWave: isMemesWave(wave?.id.toLowerCase()),
  };
}
