"use client";

import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import Button from "@/components/utils/button/Button";
import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";
import type { ApiWave } from "@/generated/models/ApiWave";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ScaleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import clsx from "clsx";
import WaveRepRatingModal from "./WaveRepRatingModal";

const WAVE_REP_ACTION_LOCALE = DEFAULT_LOCALE;
const WAVE_REP_BUTTON_BORDER_CLASSES = "!tw-border-iron-700";
const formatCompactRep = (value: number): string =>
  formatNumber(WAVE_REP_ACTION_LOCALE, value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

type WaveRepButtonVariant = "default" | "compact";

export default function WaveRepButton({
  wave,
  variant = "default",
  iconOnly = false,
}: {
  readonly wave: ApiWave;
  readonly variant?: WaveRepButtonVariant | undefined;
  readonly iconOnly?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTouchDevice = useIsTouchDevice();
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
  const showTooltip = !isTouchDevice && !isModalOpen;
  return (
    <>
      <Button
        type="button"
        aria-label={label}
        {...(showTooltip
          ? {
              "data-tooltip-id": tooltipId,
              "data-tooltip-content": tooltipContent,
            }
          : {})}
        onClick={() => setIsModalOpen(true)}
        variant="tertiary"
        size={iconOnly ? null : "xs"}
        className={clsx(
          WAVE_REP_BUTTON_BORDER_CLASSES,
          COMPACT_ACTION_TOUCH_TARGET_CLASS,
          iconOnly && "tw-size-8 tw-p-0 tw-text-xs",
          variant === "compact" &&
            "!tw-bg-transparent !tw-text-iron-200 active:!tw-bg-black desktop-hover:hover:!tw-border-iron-600 desktop-hover:hover:!tw-bg-iron-900 desktop-hover:hover:!tw-text-white"
        )}
      >
        <ScaleIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        <span className={iconOnly ? "tw-sr-only" : undefined}>
          {actionText}
        </span>
      </Button>
      {showTooltip && (
        <MyStreamActionTooltip id={tooltipId} place="bottom-end" />
      )}
      {isModalOpen && (
        <WaveRepRatingModal wave={wave} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
