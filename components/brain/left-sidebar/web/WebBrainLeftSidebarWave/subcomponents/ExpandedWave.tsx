import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, RefObject } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import BrainLeftSidebarWaveDropTime from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime";
import BrainLeftSidebarWavePin from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin";
import { WaveAvatar } from "./WaveAvatar";
import type { WaveTooltipPlacement } from "./WaveTooltip";
import { WaveTooltip } from "./WaveTooltip";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

const SUBWAVE_PREFETCH_HOVER_INTENT_MS = 150;

const getRowLayoutClasses = ({
  isChildRow,
  shouldReserveExpandControlSpace,
}: {
  readonly isChildRow: boolean;
  readonly shouldReserveExpandControlSpace: boolean;
}) => {
  if (isChildRow) {
    return {
      rowPaddingClasses: "tw-pl-[84px] tw-pr-5 md:tw-pl-[72px]",
      rowGapClasses: "tw-gap-x-2",
      linkGapClasses: "tw-space-x-2",
    };
  }

  if (shouldReserveExpandControlSpace) {
    return {
      rowPaddingClasses: "tw-pl-2 tw-pr-5 md:tw-pl-1",
      rowGapClasses: "tw-gap-x-2 md:tw-gap-x-1",
      linkGapClasses: "tw-space-x-3",
    };
  }

  return {
    rowPaddingClasses: "tw-px-5",
    rowGapClasses: "tw-gap-x-4",
    linkGapClasses: "tw-space-x-3",
  };
};

function ExpandControl({
  formattedWaveName,
  isExpanded,
  onBlur,
  onClick,
  onFocus,
  shouldReserveSpace,
  shouldShowButton,
}: {
  readonly formattedWaveName: string;
  readonly isExpanded: boolean;
  readonly onBlur: () => void;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus: () => void;
  readonly shouldReserveSpace: boolean;
  readonly shouldShowButton: boolean;
}) {
  if (!shouldReserveSpace) {
    return null;
  }

  const buttonStateClasses = isExpanded
    ? "tw-bg-iron-700/60 tw-text-iron-300 tw-opacity-100"
    : "tw-bg-transparent tw-text-iron-500 tw-opacity-70";

  return (
    <div className="tw-flex tw-h-10 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center md:tw-w-5">
      {shouldShowButton && (
        <button
          type="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${formattedWaveName} subwaves`}
          aria-expanded={isExpanded}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`tw-relative tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-p-0 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-700/70 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-opacity-100 md:tw-size-5 ${buttonStateClasses}`}
        >
          <ChevronRightIcon
            className={`tw-size-3.5 tw-transition-transform tw-duration-200 tw-ease-out ${
              isExpanded ? "tw-rotate-90" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

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
  readonly reserveExpandControlSpace?: boolean | undefined;
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
  reserveExpandControlSpace = false,
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
  const shouldReserveExpandControlSpace =
    shouldShowExpandControl || (reserveExpandControlSpace && depth === 0);
  const { rowPaddingClasses, rowGapClasses, linkGapClasses } =
    getRowLayoutClasses({
      isChildRow,
      shouldReserveExpandControlSpace,
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
      className={`tw-group tw-relative tw-flex tw-items-start ${rowGapClasses} ${rowPaddingClasses} tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      <ExpandControl
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
