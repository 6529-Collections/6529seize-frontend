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
  readonly size?: "default" | "compact" | undefined;
}

type BadgeKind = "participant" | "winner";

const BADGE_SIZE_CLASSES = {
  default: {
    button: "tw-size-5",
    icon: "tw-size-2.5",
  },
  compact: {
    button: "tw-size-[18px]",
    icon: "tw-size-[9px]",
  },
} as const;

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
      "tw-border-green/35 tw-bg-green/15 tw-text-green focus-visible:tw-ring-green/50 desktop-hover:hover:tw-border-green/60 desktop-hover:hover:tw-bg-green/25",
  },
} as const;

const getTooltipKey = (kind: BadgeKind): MessageKey => {
  if (kind === "participant") {
    return "waves.competitionBadges.participantTooltip";
  }

  return "waves.competitionBadges.winnerTooltip";
};

const WaveCompetitionBadge = ({
  kind,
  waveName,
  tooltipIdPrefix,
  showTooltip,
  onBadgeClick,
  size,
}: {
  readonly kind: BadgeKind;
  readonly waveName: string;
  readonly tooltipIdPrefix: string;
  readonly showTooltip: boolean;
  readonly onBadgeClick: (tab: WaveCompetitionPreviewTab) => void;
  readonly size: "default" | "compact";
}) => {
  const locale = useBrowserLocale();
  const id = useId();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const config = BADGE_CONFIG[kind];
  const tooltipId = `${tooltipIdPrefix}-${kind}-${id}`;
  const label = t(locale, getTooltipKey(kind), {
    wave: waveName,
  });
  const sizeClasses = BADGE_SIZE_CLASSES[size];

  return (
    <span className="tw-inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={showTooltip && isTooltipOpen ? tooltipId : undefined}
        {...(showTooltip && { "data-tooltip-id": tooltipId })}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick(config.tab);
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className={`tw-inline-flex ${sizeClasses.button} tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${config.className}`}
      >
        <FontAwesomeIcon
          icon={config.icon}
          className={`${sizeClasses.icon} tw-flex-shrink-0`}
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

export const WaveCompetitionBadges = ({
  isParticipant,
  isWinner,
  waveName,
  onBadgeClick,
  tooltipIdPrefix = "wave-competition-badge",
  size = "default",
}: WaveCompetitionBadgesProps) => {
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const showTooltip = !isMobile && !hasTouchScreen;

  return (
    <>
      {isParticipant && (
        <WaveCompetitionBadge
          kind="participant"
          waveName={waveName}
          tooltipIdPrefix={tooltipIdPrefix}
          showTooltip={showTooltip}
          onBadgeClick={onBadgeClick}
          size={size}
        />
      )}
      {isWinner && (
        <WaveCompetitionBadge
          kind="winner"
          waveName={waveName}
          tooltipIdPrefix={tooltipIdPrefix}
          showTooltip={showTooltip}
          onBadgeClick={onBadgeClick}
          size={size}
        />
      )}
    </>
  );
};
