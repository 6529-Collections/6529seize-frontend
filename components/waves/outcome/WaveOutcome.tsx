import { FC } from "react";
import { ApiWaveOutcome } from "../../../generated/models/ApiWaveOutcome";
import { WaveRepOutcome } from "./WaveRepOutcome";
import { WaveNICOutcome } from "./WaveNICOutcome";
import { WaveManualOutcome } from "./WaveManualOutcome";
import { ApiWaveOutcomeCredit } from "../../../generated/models/ApiWaveOutcomeCredit";

enum OutcomeType {
  MANUAL = "MANUAL",
  NIC = "NIC",
  REP = "REP",
}

interface WaveOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

export const WaveOutcome: FC<WaveOutcomeProps> = ({
  outcome,
}) => {
  const getOutcomeType = (): OutcomeType => {
    if (outcome.credit === ApiWaveOutcomeCredit.Rep) {
      return OutcomeType.REP;
    }
    if (outcome.credit === ApiWaveOutcomeCredit.Cic) {
      return OutcomeType.NIC;
    }
    return OutcomeType.MANUAL;
  };

  const outcomeType = getOutcomeType();

  const component: Record<OutcomeType, JSX.Element> = {
    [OutcomeType.REP]: <WaveRepOutcome outcome={outcome} />,
    [OutcomeType.NIC]: <WaveNICOutcome outcome={outcome} />,
    [OutcomeType.MANUAL]: <WaveManualOutcome outcome={outcome} />,
  };

  return <div>{component[outcomeType]}</div>;
}; 