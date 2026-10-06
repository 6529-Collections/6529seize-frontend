"use client";

import { type FC, type JSX, useMemo } from "react";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
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

export const WaveOutcome: FC<WaveOutcomeProps> = ({ waveId, outcome }) => {
  const {
    items,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isError,
    errorMessage,
  } = useWaveOutcomeDistributionQuery({
    waveId,
    outcomeIndex: outcome.index,
  });
  const distributionState: WaveOutcomeDistributionState = useMemo(
    () => ({
      items,
      totalCount,
      hasNextPage: Boolean(hasNextPage),
      isFetchingNextPage,
      fetchNextPage,
      isLoading,
      isError,
      errorMessage,
    }),
    [
      items,
      totalCount,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      isLoading,
      isError,
      errorMessage,
    ]
  );

  return <WaveOutcomeView outcome={outcome} distribution={distributionState} />;
};

export const WaveOutcomeView: FC<{
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}> = ({ outcome, distribution }) => {
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
      <WaveRepOutcome outcome={outcome} distribution={distribution} />
    ),
    [OutcomeType.NIC]: (
      <WaveNICOutcome outcome={outcome} distribution={distribution} />
    ),
    [OutcomeType.MANUAL]: (
      <WaveManualOutcome outcome={outcome} distribution={distribution} />
    ),
  };

  return <div>{component[outcomeType]}</div>;
};
