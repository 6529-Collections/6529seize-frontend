"use client";

import type { FC } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
import { WaveOutcomeAccordion } from "./WaveOutcomeAccordion";

interface WaveRepOutcomeProps {
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}

const renderRepItem = (item: ApiWaveOutcomeDistributionItem) =>
  `${formatNumberWithCommas(item.amount ?? 0)} Rep`;

export const WaveRepOutcome: FC<WaveRepOutcomeProps> = ({
  outcome,
  distribution,
}) => (
  <WaveOutcomeAccordion
    title="Rep"
    icon={<SparklesIcon className="tw-size-4 tw-text-[#C3B5D9]" aria-hidden />}
    iconClassName="tw-border-[#C3B5D9]/20 tw-bg-[#C3B5D9]/[0.05]"
    itemKeyPrefix="wave-rep-outcome"
    distribution={distribution}
    renderItem={renderRepItem}
    pool={{ amount: outcome.amount ?? 0, className: "tw-text-[#C3B5D9]" }}
    metadata={
      outcome.rep_category
        ? { label: "Category", value: outcome.rep_category }
        : undefined
    }
  />
);
