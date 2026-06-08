import type { MouseEvent, RefObject } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import BrainLeftSidebarWaveDropTime from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime";
import BrainLeftSidebarWavePin from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin";
import { WaveAvatar } from "./WaveAvatar";
import type { WaveTooltipPlacement } from "./WaveTooltip";
import { WaveTooltip } from "./WaveTooltip";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

interface ExpandedWaveProps {
  readonly formattedWaveName: string;
  readonly haveNewDrops: boolean;
  readonly href: string;
  readonly isActive: boolean;
  readonly isDropWave: boolean;
  readonly isPinned: boolean;
  readonly latestDropTimestamp?: number | null | undefined;
  readonly nameRef: RefObject<HTMLDivElement | null>;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  readonly showExpandedTooltip: boolean;
  readonly showPin: boolean;
  readonly tooltipContent: string;
  readonly tooltipId: string;
  readonly tooltipPlacement: WaveTooltipPlacement;
  readonly wave: MinimalWave;
  readonly waveId: string;
  readonly depth?: 0 | 1 | undefined;
  readonly canExpand?: boolean | undefined;
  readonly isExpanded?: boolean | undefined;
  readonly hasUnreadSubwaves?: boolean | undefined;
  readonly onToggleExpand?: ((waveId: string) => void) | undefined;
}

export const ExpandedWave = ({
  formattedWaveName,
  haveNewDrops,
  href,
  isActive,
  isDropWave,
  isPinned,
  latestDropTimestamp,
  nameRef,
  onMouseEnter,
  onClick,
  showExpandedTooltip,
  showPin,
  tooltipContent,
  tooltipId,
  tooltipPlacement,
  wave,
  waveId,
  depth = 0,
  canExpand = false,
  isExpanded = false,
  hasUnreadSubwaves = false,
  onToggleExpand,
}: ExpandedWaveProps) => {
  const tooltipAttributes = showExpandedTooltip
    ? {
        "data-tooltip-id": tooltipId,
        "data-tooltip-content": tooltipContent,
      }
    : {};
  const presentLatestDropTimestamp =
    latestDropTimestamp !== null &&
    latestDropTimestamp !== undefined &&
    latestDropTimestamp !== 0 &&
    Number.isFinite(latestDropTimestamp)
      ? latestDropTimestamp
      : null;
  const rowPaddingClasses =
    depth === 1 ? "tw-pl-9 tw-pr-5" : "tw-px-5";
  const rowGapClasses = depth === 1 ? "tw-gap-x-2" : "tw-gap-x-4";
  const shouldShowExpandControl = canExpand && depth === 0;
  const expandButtonLabel = `${isExpanded ? "Collapse" : "Expand"} ${formattedWaveName} subwaves`;

  const handleToggleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleExpand?.(waveId);
  };

  return (
    <div
      className={`tw-group tw-relative tw-flex tw-items-start ${rowGapClasses} ${rowPaddingClasses} tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      {shouldShowExpandControl ? (
        <button
          type="button"
          aria-label={expandButtonLabel}
          aria-expanded={isExpanded}
          onClick={handleToggleExpand}
          className="tw-absolute tw-left-4 tw-top-8 tw-z-10 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-iron-800 tw-p-0 tw-text-iron-200 tw-shadow-sm tw-transition-colors desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white"
        >
          <ChevronRightIcon
            className={`tw-size-4 tw-transition-transform tw-duration-200 tw-ease-out ${
              isExpanded ? "tw-rotate-90" : ""
            }`}
            aria-hidden="true"
          />
          {hasUnreadSubwaves && (
            <span
              aria-hidden="true"
              className="tw-absolute tw-bottom-0 tw-right-0 tw-size-2 tw-rounded-full tw-bg-primary-400"
            />
          )}
        </button>
      ) : depth === 1 ? (
        <div className="tw-mt-2 tw-size-5 tw-flex-shrink-0" />
      ) : null}
      <Link
        href={href}
        prefetch={false}
        {...(onMouseEnter ? { onMouseEnter } : {})}
        onClick={onClick}
        className={`tw-flex tw-min-w-0 tw-flex-1 tw-space-x-3 tw-py-1 tw-no-underline tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-font-medium tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-font-normal tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <div className="tw-relative">
          <WaveAvatar
            isActive={isActive}
            isDropWave={isDropWave}
            showNewDropsBadge={!isActive && haveNewDrops}
            wave={wave}
          />
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <div
            ref={nameRef}
            className="-tw-mt-0.5 tw-mb-0.5 tw-truncate tw-text-sm"
            {...tooltipAttributes}
          >
            {formattedWaveName}
          </div>
          {presentLatestDropTimestamp !== null && (
            <div className="tw-text-xs tw-text-iron-500">
              <span className="tw-pr-1">Last drop:</span>
              <BrainLeftSidebarWaveDropTime time={presentLatestDropTimestamp} />
            </div>
          )}
        </div>
      </Link>
      {showPin && depth === 0 && (
        <BrainLeftSidebarWavePin waveId={waveId} isPinned={isPinned} />
      )}
      {showExpandedTooltip && (
        <WaveTooltip id={tooltipId} place={tooltipPlacement}>
          {tooltipContent}
        </WaveTooltip>
      )}
    </div>
  );
};
