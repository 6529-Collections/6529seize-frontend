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
  readonly isLoadingSubwaves?: boolean | undefined;
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
  isLoadingSubwaves = false,
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
  const shouldShowPinButton = showPin && depth === 0;
  const hasSummaryScore = hasWaveTrustSummaryScore(wave.waveScore);
  const shouldShowDropTime = presentLatestDropTimestamp !== null;
  const rowVerticalPaddingClasses = isChildRow ? "tw-py-1.5" : "tw-py-2";
  const {
    rowPaddingClasses,
    rowGapClasses,
    linkGapClasses,
    rowHeightClasses,
  } =
    getSidebarWaveRowLayoutClasses({
      isChildRow,
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

  const handleRowMouseEnter = useCallback(() => {
    scheduleSubwavePrefetch();
    onMouseEnter?.();
  }, [onMouseEnter, scheduleSubwavePrefetch]);

  useEffect(() => cancelSubwavePrefetch, [cancelSubwavePrefetch]);

  const handleToggleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleExpand?.(waveId);
  };

  return (
    <div
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={cancelSubwavePrefetch}
      role="group"
      className={`tw-group tw-relative tw-flex tw-items-center ${rowHeightClasses} ${rowGapClasses} ${rowPaddingClasses} ${rowVerticalPaddingClasses} tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      {isChildRow && (
        <span
          aria-hidden="true"
          className={`tw-absolute -tw-top-1 tw-left-14 tw-w-px tw-bg-iron-700/60 md:tw-left-11 ${
            isLastSubwave ? "tw-bottom-4" : "-tw-bottom-1"
          }`}
        />
      )}
      <div
        className={`tw-flex tw-min-w-0 tw-flex-1 ${linkGapClasses} tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-font-medium tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-font-normal tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <div
          aria-hidden="true"
          data-testid="sidebar-wave-avatar"
          className="tw-relative tw-flex-shrink-0"
        >
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
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-0.5">
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
                <Link
                  href={href}
                  prefetch={false}
                  onClick={onClick}
                  className={`tw-static tw-block tw-min-w-0 tw-flex-shrink tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-z-[5] before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-inset focus-visible:before:tw-ring-primary-400 ${
                    isActive
                      ? "tw-text-white desktop-hover:group-hover:tw-text-white"
                      : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
                  }`}
                >
                  <div
                    ref={nameRef}
                    className="tw-relative tw-z-[6] tw-truncate tw-text-sm tw-leading-tight"
                    {...tooltipAttributes}
                  >
                    {formattedWaveName}
                  </div>
                </Link>
                {shouldShowExpandControl && (
                  <span className="tw-relative tw-z-10 tw-inline-flex">
                    <SidebarWaveExpandControl
                      formattedWaveName={formattedWaveName}
                      isExpanded={isExpanded}
                      isLoading={isLoadingSubwaves}
                      onBlur={cancelSubwavePrefetch}
                      onClick={handleToggleExpand}
                      onFocus={scheduleSubwavePrefetch}
                      shouldShowButton={shouldShowExpandControl}
                    />
                  </span>
                )}
                {shouldShowPinButton && (
                  <BrainLeftSidebarWavePin
                    waveId={waveId}
                    isPinned={isPinned}
                    compact
                    className="tw-relative tw-z-10 tw-shrink-0"
                  />
                )}
              </div>
              {shouldShowDropTime && (
                <div className="tw-inline-flex tw-min-w-0 tw-items-center tw-whitespace-nowrap tw-text-xs tw-leading-none tw-text-iron-500 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-iron-400">
                  <BrainLeftSidebarWaveDropTime
                    time={presentLatestDropTimestamp}
                  />
                </div>
              )}
            </div>
            {hasSummaryScore && (
              <span className="tw-relative tw-z-10 tw-ml-auto tw-mt-[1px] tw-shrink-0">
                <WaveTrustSignals
                  waveRep={wave.waveRep}
                  waveScore={wave.waveScore}
                  variant="sidebar-inline"
                  mode="summary"
                />
              </span>
            )}
          </div>
        </div>
      </div>
      {showExpandedTooltip && (
        <WaveTooltip id={tooltipId} place={tooltipPlacement}>
          {tooltipContent}
        </WaveTooltip>
      )}
    </div>
  );
};
