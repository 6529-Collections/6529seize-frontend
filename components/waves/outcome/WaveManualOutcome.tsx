"use client";

import type { FC } from "react";
import { TrophyIcon } from "@heroicons/react/24/outline";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
import { WaveOutcomeAccordion } from "./WaveOutcomeAccordion";

interface WaveManualOutcomeProps {
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}

const renderManualItem = (item: ApiWaveOutcomeDistributionItem) =>
  item.amount === 0 ? "-" : (item.description ?? "");

export const WaveManualOutcome: FC<WaveManualOutcomeProps> = ({
  outcome,
  distribution,
}) => (
  <WaveOutcomeAccordion
    title="Manual"
    icon={<TrophyIcon className="tw-size-4 tw-text-[#E8D48A]" aria-hidden />}
    iconClassName="tw-border-[#E8D48A]/20 tw-bg-[#E8D48A]/[0.05]"
    itemKeyPrefix="wave-manual-outcome"
    distribution={distribution}
    renderItem={renderManualItem}
    metadata={
      outcome.description
        ? { label: "Description", value: outcome.description }
        : undefined
    }
  />
);
