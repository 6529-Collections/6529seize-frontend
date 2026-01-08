import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import Link from "next/link";
import { WaveAvatar } from "./WaveAvatar";
import type { WaveTooltipPlacement } from "./WaveTooltip";
import { WaveTooltip } from "./WaveTooltip";

interface CollapsedWaveProps {
  readonly formattedWaveName: string;
  readonly haveNewDrops: boolean;
  readonly href: string;
  readonly isActive: boolean;
  readonly isDropWave: boolean;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  readonly showTooltip: boolean;
  readonly tooltipId: string;
  readonly tooltipPlacement: WaveTooltipPlacement;
  readonly wave: MinimalWave;
}

export const CollapsedWave = ({
  formattedWaveName,
  haveNewDrops,
  href,
  isActive,
  isDropWave,
  onMouseEnter,
  onClick,
  showTooltip,
  tooltipId,
  tooltipPlacement,
  wave,
}: CollapsedWaveProps) => (
  <div
    className={`tw-group tw-flex tw-items-center tw-justify-center tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
      isActive
        ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
        : "desktop-hover:hover:tw-bg-iron-800/70"
    }`}>
    <Link
      href={href}
      {...(onMouseEnter ? { onMouseEnter } : {})}
      onClick={onClick}
      className="tw-flex tw-items-center tw-justify-center tw-no-underline"
      {...(showTooltip ? { "data-tooltip-id": tooltipId } : {})}>
      <div className="tw-relative">
        <WaveAvatar
          isActive={isActive}
          isDropWave={isDropWave}
          showNewDropsBadge={!isActive && haveNewDrops}
          wave={wave}
        />
      </div>
    </Link>
    {showTooltip && (
      <WaveTooltip id={tooltipId} place={tooltipPlacement}>
        {formattedWaveName}
      </WaveTooltip>
    )}
  </div>
);
