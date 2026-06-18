import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, RefObject } from "react";
import Link from "next/link";
import BrainLeftSidebarWaveDropTime from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime";
import BrainLeftSidebarWavePin from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin";
import { SidebarWaveExpandControl } from "@/components/brain/left-sidebar/waves/SidebarWaveExpandControl";
import { getSidebarWaveRowLayoutClasses } from "@/components/brain/left-sidebar/waves/sidebarWaveRowLayout";
import {
  hasWaveTrustSummaryScore,
  WaveTrustSignals,
} from "@/components/waves/WaveTrustSignals";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { Tooltip } from "react-tooltip";
import { WaveAvatar } from "./WaveAvatar";
import type { WaveTooltipPlacement } from "./WaveTooltip";
import { WaveTooltip } from "./WaveTooltip";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

const SUBWAVE_PREFETCH_HOVER_INTENT_MS = 150;

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
  readonly isLastSubwave?: boolean | undefined;
  readonly onToggleExpand?: ((waveId: string) => void) | undefined;
  readonly onPrefetchSubwaves?: ((waveId: string) => void) | undefined;
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
  isLastSubwave = false,
  onToggleExpand,
  onPrefetchSubwaves,
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
  const isChildRow = depth === 1;
  const shouldShowExpandControl = canExpand && depth === 0;
  const shouldReserveExpandControlSpace = shouldShowExpandControl;
  const shouldShowPinButton = showPin && depth === 0;
  const trustSignalsTooltipId = `sidebar-expanded-wave-trust-signals-${waveId}`;
  const hasSummaryScore = hasWaveTrustSummaryScore(wave.waveScore);
  const shouldShowTrustSignalsRow =
    hasSummaryScore || presentLatestDropTimestamp !== null;
  const { rowPaddingClasses, rowGapClasses, linkGapClasses } =
    getSidebarWaveRowLayoutClasses({
      isChildRow,
      shouldReserveExpandControlSpace,
      variant: "web",
    });
  const subwavePrefetchTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const shouldPrefetchSubwaves = Boolean(
    shouldShowExpandControl && onPrefetchSubwaves
  );

  const cancelSubwavePrefetch = useCallback(() => {
    if (subwavePrefetchTimerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(subwavePrefetchTimerRef.current);
    subwavePrefetchTimerRef.current = null;
  }, []);

  const scheduleSubwavePrefetch = useCallback(() => {
    if (!shouldPrefetchSubwaves) {
      return;
    }

    cancelSubwavePrefetch();
    subwavePrefetchTimerRef.current = globalThis.setTimeout(() => {
      subwavePrefetchTimerRef.current = null;
      onPrefetchSubwaves?.(waveId);
    }, SUBWAVE_PREFETCH_HOVER_INTENT_MS);
  }, [
    cancelSubwavePrefetch,
    onPrefetchSubwaves,
    shouldPrefetchSubwaves,
    waveId,
  ]);

  useEffect(() => cancelSubwavePrefetch, [cancelSubwavePrefetch]);

  const handleToggleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleExpand?.(waveId);
  };

  return (
    <div
      onMouseEnter={scheduleSubwavePrefetch}
      onMouseLeave={cancelSubwavePrefetch}
      role="group"
      className={`tw-group tw-relative tw-flex tw-items-start ${rowGapClasses} ${rowPaddingClasses} tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      <SidebarWaveExpandControl
        formattedWaveName={formattedWaveName}
        isExpanded={isExpanded}
        onBlur={cancelSubwavePrefetch}
        onClick={handleToggleExpand}
        onFocus={scheduleSubwavePrefetch}
        shouldReserveSpace={shouldReserveExpandControlSpace}
        shouldShowButton={shouldShowExpandControl}
      />
      {isChildRow && (
        <span
          aria-hidden="true"
          className={`tw-absolute -tw-top-1 tw-left-14 tw-w-px tw-bg-iron-700/60 md:tw-left-11 ${
            isLastSubwave ? "tw-bottom-4" : "-tw-bottom-1"
          }`}
        />
      )}
      <Link
        href={href}
        prefetch={false}
        {...(onMouseEnter ? { onMouseEnter } : {})}
        onClick={onClick}
        className={`tw-flex tw-min-w-0 tw-flex-1 ${linkGapClasses} tw-py-1 tw-no-underline tw-transition-all tw-duration-200 tw-ease-out ${
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
            size={isChildRow ? "sm" : "default"}
          />
          {hasUnreadSubwaves && (
            <span
              aria-hidden="true"
              className="tw-absolute tw-right-[-3px] tw-top-[-3px] tw-size-2.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-primary-400"
            />
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <div
            ref={nameRef}
            className={`-tw-mt-1 tw-mb-1 tw-truncate tw-text-sm ${
              shouldShowPinButton ? "tw-pr-7" : ""
            }`}
            {...tooltipAttributes}
          >
            {formattedWaveName}
          </div>
          {shouldShowTrustSignalsRow && (
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500">
              {presentLatestDropTimestamp !== null && (
                <span className="tw-flex tw-min-w-0 tw-items-center tw-whitespace-nowrap">
                  <BrainLeftSidebarWaveDropTime
                    time={presentLatestDropTimestamp}
                  />
                </span>
              )}
              {hasSummaryScore && (
                <WaveTrustSignals
                  waveRep={wave.waveRep}
                  waveScore={wave.waveScore}
                  variant="sidebar-inline"
                  mode="summary"
                  className="tw-ml-auto tw-shrink-0"
                  tooltipId={trustSignalsTooltipId}
                />
              )}
            </div>
          )}
        </div>
      </Link>
      {shouldShowPinButton && (
        <BrainLeftSidebarWavePin
          waveId={waveId}
          isPinned={isPinned}
          compact
          className="tw-absolute tw-right-3 tw-top-2 tw-z-10"
        />
      )}
      {showExpandedTooltip && (
        <WaveTooltip id={tooltipId} place={tooltipPlacement}>
          {tooltipContent}
        </WaveTooltip>
      )}
      {hasSummaryScore && (
        <Tooltip
          id={trustSignalsTooltipId}
          place="top"
          offset={8}
          opacity={1}
          positionStrategy="fixed"
          style={TOOLTIP_STYLES}
        />
      )}
    </div>
  );
};
