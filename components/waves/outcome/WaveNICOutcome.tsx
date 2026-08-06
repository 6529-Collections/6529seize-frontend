"use client";

import type { FC } from "react";
import { IdentificationIcon } from "@heroicons/react/24/outline";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
import { WaveOutcomeAccordion } from "./WaveOutcomeAccordion";

interface WaveNICOutcomeProps {
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}

const renderNICItem = (item: ApiWaveOutcomeDistributionItem) =>
  `${formatNumberWithCommas(item.amount ?? 0)} NIC`;

export const WaveNICOutcome: FC<WaveNICOutcomeProps> = ({
  outcome,
  distribution,
}) => (
  <WaveOutcomeAccordion
    title="NIC"
    icon={
      <IdentificationIcon className="tw-size-4 tw-text-[#A4C2DB]" aria-hidden />
    }
    iconClassName="tw-border-[#A4C2DB]/20 tw-bg-[#A4C2DB]/[0.05]"
    itemKeyPrefix="wave-nic-outcome"
    distribution={distribution}
    renderItem={renderNICItem}
    pool={{ amount: outcome.amount ?? 0, className: "tw-text-[#A4C2DB]" }}
  />
);
