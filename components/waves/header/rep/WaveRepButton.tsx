"use client";

import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import Button from "@/components/utils/button/Button";
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
  const authenticatedUserContribution =
    wave.wave_rep?.authenticated_user_contribution ?? 0;
  const hasUserContribution = authenticatedUserContribution !== 0;
  const actionText = hasUserContribution
    ? t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.edit")
    : t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.add");
  const label = hasUserContribution
    ? t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.editAriaLabel", {
        contribution: formatCompactRep(authenticatedUserContribution),
      })
    : t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.addAriaLabel");
  const tooltipContent = t(WAVE_REP_ACTION_LOCALE, "waves.rep.action.tooltip");
  const tooltipId = `wave-rep-rating-${wave.id}`;
  return (
    <>
      <Button
        type="button"
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipContent}
        onClick={() => setIsModalOpen(true)}
        variant="tertiary"
        size={variant === "compact" ? "xs" : "sm"}
        className={
          variant === "compact"
            ? "!tw-h-7 !tw-rounded-md !tw-border-white/[0.08] !tw-bg-white/[0.05] !tw-px-2 !tw-text-[11px] !tw-font-medium !tw-text-iron-300 !tw-shadow-none desktop-hover:hover:!tw-border-white/[0.12] desktop-hover:hover:!tw-bg-white/[0.08] desktop-hover:hover:!tw-text-iron-100 active:!tw-bg-white/[0.1]"
            : undefined
        }
      >
        <ScaleIcon
          className={`${
            variant === "compact" ? "tw-size-3.5" : "tw-size-4"
          } tw-flex-shrink-0`}
          aria-hidden="true"
        />
        <span>{actionText}</span>
      </Button>
      <MyStreamActionTooltip id={tooltipId} />
      {isModalOpen && (
        <WaveRepRatingModal wave={wave} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
