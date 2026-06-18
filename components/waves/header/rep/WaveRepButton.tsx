"use client";

import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ScaleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import WaveRepRatingModal from "./WaveRepRatingModal";

const WAVE_REP_ACTION_LOCALE = DEFAULT_LOCALE;
const formatCompactRep = (value: number): string =>
  formatNumber(WAVE_REP_ACTION_LOCALE, value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

type WaveRepButtonVariant = "default" | "compact";

export default function WaveRepButton({
  wave,
  variant = "default",
}: {
  readonly wave: ApiWave;
  readonly variant?: WaveRepButtonVariant | undefined;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalRep = wave.wave_rep?.total_rep ?? null;
  const authenticatedUserContribution =
    wave.wave_rep?.authenticated_user_contribution ?? 0;
  const hasUserContribution = authenticatedUserContribution !== 0;
  const formattedTotalRep =
    totalRep === null ? null : formatCompactRep(totalRep);
  const actionText = hasUserContribution
    ? t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.remove")
    : t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.add");
  const label = hasUserContribution
    ? t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.editRemoveAriaLabel", {
        contribution: formatCompactRep(authenticatedUserContribution),
      })
    : t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.addAriaLabel");
  const tooltipId = `wave-rep-rating-${wave.id}`;
  const isCompact = variant === "compact";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        onClick={() => setIsModalOpen(true)}
        className={`tw-flex tw-h-8 tw-min-w-8 tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-all tw-duration-200 hover:tw-border-primary-400/70 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${
          isCompact ? "tw-px-2" : "tw-px-2.5"
        }`}
      >
        <ScaleIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        <span>{actionText}</span>
        {!isCompact && formattedTotalRep !== null && (
          <span className="tw-rounded-md tw-bg-black/25 tw-px-1.5 tw-py-0.5 tw-text-iron-300">
            {formattedTotalRep}
          </span>
        )}
      </button>
      <MyStreamActionTooltip id={tooltipId} />
      {isModalOpen && (
        <WaveRepRatingModal wave={wave} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
