import { FC } from "react";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";
import { WaveDetailedRepOutcome } from "./WaveDetailedRepOutcome";
import { WaveDetailedNICOutcome } from "./WaveDetailedNICOutcome";
import { WaveDetailedManualOutcome } from "./WaveDetailedManualOutcome";
import { ApiWaveOutcomeCredit } from "../../../../generated/models/ApiWaveOutcomeCredit";

enum OutcomeType {
  MANUAL = "MANUAL",
  NIC = "NIC",
  REP = "REP",
}

interface WaveDetailedOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

export const WaveDetailedOutcome: FC<WaveDetailedOutcomeProps> = ({
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
    [OutcomeType.REP]: <WaveDetailedRepOutcome outcome={outcome} />,
    [OutcomeType.NIC]: <WaveDetailedNICOutcome outcome={outcome} />,
    [OutcomeType.MANUAL]: <WaveDetailedManualOutcome outcome={outcome} />,
  };

  return <div>{component[outcomeType]}</div>;
};
