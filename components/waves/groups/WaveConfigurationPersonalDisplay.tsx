"use client";

import TooltipIconButton from "@/components/common/TooltipIconButton";
import BoostedDropsDisplayPreference from "@/components/waves/boosted-drops/BoostedDropsDisplayPreference";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import WavePanelSection from "./WavePanelSection";

export default function WaveConfigurationPersonalDisplay() {
  const tooltipText = t(
    DEFAULT_LOCALE,
    "waveChat.boostedDrops.display.personalTooltip"
  );

  return (
    <WavePanelSection
      title={t(DEFAULT_LOCALE, "waveChat.boostedDrops.display.sectionTitle")}
      titleAccessory={
        <TooltipIconButton
          aria-label={t(
            DEFAULT_LOCALE,
            "waveChat.boostedDrops.display.personalTooltipAriaLabel"
          )}
          icon={faInfoCircle}
          tooltipPosition="left"
          tooltipText={tooltipText}
          tooltipWidth="tw-w-64"
        />
      }
    >
      <BoostedDropsDisplayPreference />
    </WavePanelSection>
  );
}
