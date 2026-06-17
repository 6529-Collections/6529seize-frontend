"use client";

import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ScaleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import WaveRepRatingModal from "./WaveRepRatingModal";

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function WaveRepButton({ wave }: { readonly wave: ApiWave }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalRep = wave.wave_rep?.total_rep ?? null;
  const formattedTotalRep =
    totalRep === null ? null : compactNumberFormatter.format(totalRep);
  const label =
    formattedTotalRep === null
      ? "Rate wave REP"
      : `Rate wave REP. Current total ${formattedTotalRep}`;
  const tooltipId = `wave-rep-rating-${wave.id}`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        onClick={() => setIsModalOpen(true)}
        className="tw-flex tw-h-8 tw-min-w-8 tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-all tw-duration-200 hover:tw-border-primary-400/70 hover:tw-bg-iron-800 hover:tw-text-white"
      >
        <ScaleIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        {formattedTotalRep !== null && <span>{formattedTotalRep}</span>}
      </button>
      <MyStreamActionTooltip id={tooltipId} />
      {isModalOpen && (
        <WaveRepRatingModal wave={wave} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
