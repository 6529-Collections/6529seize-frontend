"use client";

import { FC, type JSX } from "react";
import { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import { useWaveOutcomeDistributionQuery } from "@/hooks/waves/useWaveOutcomeDistributionQuery";
import { WaveRepOutcome } from "./WaveRepOutcome";
import { WaveNICOutcome } from "./WaveNICOutcome";
import { WaveManualOutcome } from "./WaveManualOutcome";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";

enum OutcomeType {
  MANUAL = "MANUAL",
  NIC = "NIC",
  REP = "REP",
}

interface WaveOutcomeProps {
  readonly waveId: string;
  readonly outcome: ApiWaveOutcome;
}

interface WaveOutcomeDistributionState {
  readonly items: ApiWaveOutcomeDistributionItem[];
  readonly totalCount: number;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => void;
}

export const WaveOutcome: FC<WaveOutcomeProps> = ({ waveId, outcome }) => {
  const {
    items,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useWaveOutcomeDistributionQuery({
    waveId,
    outcomeIndex: outcome.index,
  });
  const distributionState: WaveOutcomeDistributionState = {
    items,
    totalCount,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  };

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
    [OutcomeType.REP]: (
      <WaveRepOutcome outcome={outcome} distribution={distributionState} />
    ),
    [OutcomeType.NIC]: (
      <WaveNICOutcome outcome={outcome} distribution={distributionState} />
    ),
    [OutcomeType.MANUAL]: (
      <WaveManualOutcome outcome={outcome} distribution={distributionState} />
    ),
  };

  return <div>{component[outcomeType]}</div>;
}; 
