import { ApiDrop } from "../../generated/models/ApiDrop";
import { ApiWave } from "../../generated/models/ApiWave";
import { ApiWaveOutcomeCredit } from "../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "../../generated/models/ApiWaveOutcomeType";

export enum OutcomeType {
  NIC = "NIC",
  REP = "REP",
  MANUAL = "MANUAL",
}

interface NICOutcome {
  type: OutcomeType.NIC;
  value: number;
}

interface REPOutcome {
  type: OutcomeType.REP;
  value: number;
  category: string;
}

interface ManualOutcome {
  type: OutcomeType.MANUAL;
  description: string;
}

interface DropOutcomes {
  outcomes: {
    nicOutcomes: NICOutcome[];
    repOutcomes: REPOutcome[];
    manualOutcomes: ManualOutcome[];
  };
  haveOutcomes: boolean;
}

export interface DropOutcomesInput {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
}

export function useDropOutcomes({
  drop,
  wave,
}: DropOutcomesInput): DropOutcomes {
  const rank = drop.rank;
  if (!rank || !wave?.outcomes) {
    return {
      outcomes: { nicOutcomes: [], repOutcomes: [], manualOutcomes: [] },
      haveOutcomes: false,
    };
  }

  const nicOutcomes = wave.outcomes
    .filter((outcome) => outcome.credit === ApiWaveOutcomeCredit.Cic)
    .map((outcome) => ({
      type: OutcomeType.NIC as const,
      value: outcome.distribution?.[rank - 1]?.amount ?? 0,
    }))
    .filter((outcome) => outcome.value > 0);

  const repOutcomes = wave.outcomes
    .filter((outcome) => outcome.credit === ApiWaveOutcomeCredit.Rep)
    .map((outcome) => ({
      type: OutcomeType.REP as const,
      value: outcome.distribution?.[rank - 1]?.amount ?? 0,
      category: outcome.rep_category ?? "",
    }))
    .filter((outcome) => outcome.value > 0);

  const manualOutcomes = wave.outcomes
    .filter((outcome) => outcome.type === ApiWaveOutcomeType.Manual)
    .map((outcome) => ({
      type: OutcomeType.MANUAL as const,
      description: outcome.distribution?.[rank - 1]?.description ?? "",
    }))
    .filter((outcome) => outcome.description !== "");

  const outcomes = { nicOutcomes, repOutcomes, manualOutcomes };
  const haveOutcomes =
    !!nicOutcomes.length || !!repOutcomes.length || !!manualOutcomes.length;
  return {
    outcomes,
    haveOutcomes,
  };
}
