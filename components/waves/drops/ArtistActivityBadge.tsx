"use client";

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";

const PALETTE_BUTTON_CLASS =
  "tw-relative tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-blue-400/20 tw-bg-blue-500/10 tw-text-blue-400 tw-transition-colors tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-400/30 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-blue-300/30 desktop-hover:hover:tw-bg-blue-500/15 desktop-hover:hover:tw-text-blue-300";

const TROPHY_BUTTON_CLASS =
  "tw-relative tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-yellow-500/20 tw-bg-yellow-500/10 tw-text-[#ffc107] tw-transition-colors tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-yellow-500/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-yellow-400/30 desktop-hover:hover:tw-bg-yellow-500/15 desktop-hover:hover:tw-text-yellow-300";

const PALETTE_ICON_CLASS =
  "tw-h-2.5 tw-w-2.5 tw-flex-shrink-0 tw-text-blue-400";
const TROPHY_ICON_CLASS =
  "tw-h-2.5 tw-w-2.5 tw-flex-shrink-0 tw-text-[#ffc107]";
const BOTH_STATE_DOT_CLASS =
  "tw-pointer-events-none tw-absolute -tw-right-1 -tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-border tw-border-solid tw-border-black tw-bg-[#4285f4] tw-shadow-[0_0_4px_rgba(66,133,244,0.6)]";

type BadgeState = "none" | "active" | "winners" | "both";

function getBadgeState(
  submissionCount: number,
  trophyCount: number
): BadgeState {
  const hasSubmissions = submissionCount > 0;
  const hasTrophyArtworks = trophyCount > 0;

  if (hasSubmissions && hasTrophyArtworks) return "both";
  if (hasSubmissions) return "active";
  if (hasTrophyArtworks) return "winners";
  return "none";
}

const BADGE_CONFIG: Record<
  Exclude<BadgeState, "none">,
  {
    readonly icon: typeof faPalette;
    readonly buttonClassName: string;
    readonly showDot: boolean;
    readonly initialTab: ArtistPreviewTab;
  }
> = {
  active: {
    icon: faPalette,
    buttonClassName: PALETTE_BUTTON_CLASS,
    showDot: false,
    initialTab: "active",
  },
  winners: {
    icon: faTrophy,
    buttonClassName: TROPHY_BUTTON_CLASS,
    showDot: false,
    initialTab: "winners",
  },
  both: {
    icon: faTrophy,
    buttonClassName: TROPHY_BUTTON_CLASS,
    showDot: true,
    initialTab: "active",
  },
};

function getTooltipContent(
  state: BadgeState,
  submissionCount: number,
  trophyCount: number
): string {
  const submissionsLabel = `${submissionCount} art submission${
    submissionCount === 1 ? "" : "s"
  }`;
  const trophyLabel = `${trophyCount} minted meme${
    trophyCount === 1 ? "" : "s"
  }`;

  if (state === "both") {
    return `View ${submissionsLabel} and ${trophyLabel}`;
  }

  if (state === "active") {
    return `View ${submissionsLabel}`;
  }

  return `View ${trophyLabel}`;
}

interface ArtistActivityBadgeProps {
  readonly submissionCount: number;
  readonly trophyCount: number;
  readonly onBadgeClick: (tab: ArtistPreviewTab) => void;
  readonly tooltipId?: string | undefined;
}

export const ArtistActivityBadge: React.FC<ArtistActivityBadgeProps> = ({
  submissionCount,
  trophyCount,
  onBadgeClick,
  tooltipId = "artist-activity-badge",
}) => {
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  const state = getBadgeState(submissionCount, trophyCount);
  if (state === "none") return null;

  const showTooltip = !isMobile && !hasTouchScreen;
  const dataTooltipId = showTooltip ? uniqueTooltipId : undefined;

  const config = BADGE_CONFIG[state];
  const initialTab = config.initialTab;
  const tooltipContent = getTooltipContent(state, submissionCount, trophyCount);
  const ariaLabel = tooltipContent;
  const isPaletteIcon = config.icon === faPalette;
  const iconClassName = isPaletteIcon ? PALETTE_ICON_CLASS : TROPHY_ICON_CLASS;
  const describedById =
    showTooltip && isTooltipOpen ? uniqueTooltipId : undefined;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick(initialTab);
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className={config.buttonClassName}
        aria-label={ariaLabel}
        aria-describedby={describedById}
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        <FontAwesomeIcon icon={config.icon} className={iconClassName} />

        {config.showDot && (
          <span className={BOTH_STATE_DOT_CLASS} aria-hidden="true" />
        )}
      </button>

      {showTooltip && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        >
          <span className="tw-text-xs">{tooltipContent}</span>
        </Tooltip>
      )}
    </>
  );
};
