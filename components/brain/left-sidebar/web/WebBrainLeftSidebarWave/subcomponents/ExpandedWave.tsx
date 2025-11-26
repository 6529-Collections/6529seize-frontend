import type { MutableRefObject } from 'react';
import Link from 'next/link';
import type { MinimalWave } from '@/contexts/wave/hooks/useEnhancedWavesList';
import BrainLeftSidebarWaveDropTime from '@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime';
import BrainLeftSidebarWavePin from '@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin';
import { WaveAvatar } from './WaveAvatar';
import { WaveTooltip, WaveTooltipPlacement } from './WaveTooltip';

interface ExpandedWaveProps {
  readonly formattedWaveName: string;
  readonly haveNewDrops: boolean;
  readonly href: string;
  readonly isActive: boolean;
  readonly isDropWave: boolean;
  readonly isPinned: boolean;
  readonly latestDropTimestamp?: number | null;
  readonly nameRef: MutableRefObject<HTMLDivElement | null>;
  readonly onMouseEnter?: () => void;
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  readonly showExpandedTooltip: boolean;
  readonly showPin: boolean;
  readonly tooltipContent: string;
  readonly tooltipId: string;
  readonly tooltipPlacement: WaveTooltipPlacement;
  readonly wave: MinimalWave;
  readonly waveId: string;
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
}: ExpandedWaveProps) => {
  const tooltipAttributes = showExpandedTooltip
    ? {
        'data-tooltip-id': tooltipId,
        'data-tooltip-content': tooltipContent,
      }
    : {};

  return (
    <div
      className={`tw-group tw-flex tw-items-start tw-gap-x-4 tw-px-5 tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? 'tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70'
          : 'desktop-hover:hover:tw-bg-iron-800/80'
      }`}
    >
      <Link
        href={href}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={`tw-flex tw-flex-1 tw-min-w-0 tw-space-x-3 tw-no-underline tw-py-1 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? 'tw-text-white desktop-hover:group-hover:tw-text-white tw-font-medium'
            : 'tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300 tw-font-normal'
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
        <div className="tw-flex-1 tw-min-w-0">
          <div
            ref={nameRef}
            className="tw-text-sm -tw-mt-0.5 tw-mb-0.5 tw-truncate"
            {...tooltipAttributes}
          >
            {formattedWaveName}
          </div>
          {!!latestDropTimestamp && (
            <div className="tw-text-xs tw-text-iron-500">
              <span className="tw-pr-1">Last drop:</span>
              <BrainLeftSidebarWaveDropTime time={latestDropTimestamp} />
            </div>
          )}
        </div>
      </Link>
      {showPin && <BrainLeftSidebarWavePin waveId={waveId} isPinned={isPinned} />}
      {showExpandedTooltip && (
        <WaveTooltip id={tooltipId} place={tooltipPlacement}>
          {tooltipContent}
        </WaveTooltip>
      )}
    </div>
  );
};
