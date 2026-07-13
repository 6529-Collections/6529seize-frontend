"use client";

import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { faFlag, faMedal } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useId, useState } from "react";
import { Tooltip } from "react-tooltip";

export type WaveCompetitionPreviewTab = "active" | "winners";

interface WaveCompetitionBadgesProps {
  readonly isParticipant: boolean;
  readonly isWinner: boolean;
  readonly waveName: string;
  readonly onBadgeClick: (tab: WaveCompetitionPreviewTab) => void;
  readonly tooltipIdPrefix?: string | undefined;
}

type BadgeKind = "participant" | "winner";

const BADGE_CONFIG = {
  participant: {
    icon: faFlag,
    tab: "active",
    className:
      "tw-border-violet-400/35 tw-bg-violet-500/15 tw-text-violet-300 focus-visible:tw-ring-violet-400/50 desktop-hover:hover:tw-border-violet-300/60 desktop-hover:hover:tw-bg-violet-500/25 desktop-hover:hover:tw-text-violet-200",
  },
  winner: {
    icon: faMedal,
    tab: "winners",
    className:
      "tw-border-emerald-400/35 tw-bg-emerald-500/15 tw-text-emerald-300 focus-visible:tw-ring-emerald-400/50 desktop-hover:hover:tw-border-emerald-300/60 desktop-hover:hover:tw-bg-emerald-500/25 desktop-hover:hover:tw-text-emerald-200",
  },
} as const;

const getTooltipKey = (kind: BadgeKind): MessageKey => {
  if (kind === "participant") {
    return "waves.competitionBadges.participantTooltip";
  }

  return "waves.competitionBadges.winnerTooltip";
};

export const WaveCompetitionBadges = ({
  isParticipant,
  isWinner,
  waveName,
  onBadgeClick,
  tooltipIdPrefix = "wave-competition-badge",
}: WaveCompetitionBadgesProps) => {
  const locale = useBrowserLocale();
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const id = useId();
  const [openTooltip, setOpenTooltip] = useState<BadgeKind | null>(null);
  const showTooltip = !isMobile && !hasTouchScreen;

  const renderBadge = (kind: BadgeKind, shouldRender: boolean) => {
    if (!shouldRender) {
      return null;
    }

    const config = BADGE_CONFIG[kind];
    const tooltipId = `${tooltipIdPrefix}-${kind}-${id}`;
    const label = t(locale, getTooltipKey(kind), {
      wave: waveName,
    });
    const isTooltipOpen = openTooltip === kind;

    return (
      <span className="tw-inline-flex" key={kind}>
        <button
          type="button"
          aria-label={label}
          aria-describedby={
            showTooltip && isTooltipOpen ? tooltipId : undefined
          }
          {...(showTooltip && { "data-tooltip-id": tooltipId })}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpenTooltip(null);
            onBadgeClick(config.tab);
          }}
          onMouseEnter={() => setOpenTooltip(kind)}
          onMouseLeave={() => setOpenTooltip(null)}
          className={`tw-inline-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${config.className}`}
        >
          <FontAwesomeIcon
            icon={config.icon}
            className="tw-size-3 tw-flex-shrink-0"
          />
        </button>
        {showTooltip && (
          <Tooltip
            id={tooltipId}
            place="top"
            positionStrategy="fixed"
            offset={8}
            opacity={1}
            style={TOOLTIP_STYLES}
            isOpen={isTooltipOpen}
          >
            <span className="tw-text-xs">{label}</span>
          </Tooltip>
        )}
      </span>
    );
  };

  return (
    <>
      {renderBadge("participant", isParticipant)}
      {renderBadge("winner", isWinner)}
    </>
  );
};
