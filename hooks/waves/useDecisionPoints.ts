import { ApiWave } from "../../generated/models/ApiWave";
import { DecisionPoint } from "../../helpers/waves/time.types";
import { calculateLastDecisionTime } from "../../helpers/waves/time.utils";

export const useDecisionPoints = (wave: ApiWave) => {
  // Function that calculates decision points for a wave
  const getDecisionPoints = (wave: ApiWave): DecisionPoint[] => {
    // Create an empty array for decision points
    const decisions: DecisionPoint[] = [];

    if (!wave.wave.decisions_strategy?.first_decision_time) {
      return decisions;
    }
    const firstDecisionTime = wave.wave.decisions_strategy?.first_decision_time;
    const lastDecisionTime = calculateLastDecisionTime(wave);

    if (firstDecisionTime > lastDecisionTime) {
      return decisions;
    }

    decisions.push({
      id: 0,
      name: "First Decision",
      timestamp: firstDecisionTime,
    });

    let currentTime = firstDecisionTime;
    let decisionIndex = 0;

    const maxDecisionIndex =
      wave.wave.decisions_strategy.subsequent_decisions.length - 1;
    do {
      if (decisionIndex > maxDecisionIndex) {
        decisionIndex = 0;
      }
      const nextDecisionTime =
        currentTime +
        wave.wave.decisions_strategy.subsequent_decisions[decisionIndex];
      if (nextDecisionTime > lastDecisionTime) {
        break;
      }
      decisions.push({
        id: decisions.length,
        name: `Decision ${decisions.length}`,
        timestamp: nextDecisionTime,
      });
      currentTime = nextDecisionTime;
      decisionIndex++;
    } while (currentTime < lastDecisionTime);
    return decisions;
  };

  // Call the function and get all decision points
  const allDecisions = getDecisionPoints(wave);

  return {
    allDecisions: allDecisions,
  };
};
