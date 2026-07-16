import Link from "next/link";
import { WaveAvatar } from "./WaveAvatar";
import type { WaveTooltipPlacement } from "./WaveTooltip";
import { WaveTooltip } from "./WaveTooltip";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

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
  readonly hasUnreadSubwaves?: boolean | undefined;
}

const getUnreadDropsLabel = (count: number) =>
  `${count} unread ${count === 1 ? "drop" : "drops"}`;

const getCollapsedWaveLinkLabel = ({
  formattedWaveName,
  haveNewDrops,
  isActive,
  hasUnreadSubwaves,
  wave,
}: Pick<
  CollapsedWaveProps,
  | "formattedWaveName"
  | "haveNewDrops"
  | "isActive"
  | "hasUnreadSubwaves"
  | "wave"
>) => {
  const labelParts = [formattedWaveName];
  const showsUnreadDropsBadge =
    !wave.isMuted && (wave.unreadDropsCount > 0 || (!isActive && haveNewDrops));
  const unreadDropsCount = Math.max(
    wave.unreadDropsCount,
    wave.newDropsCount.count
  );

  if (showsUnreadDropsBadge && unreadDropsCount > 0) {
    labelParts.push(getUnreadDropsLabel(unreadDropsCount));
  }

  if (hasUnreadSubwaves) {
    labelParts.push("has unread subwaves");
  }

  return labelParts.join(", ");
};

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
  hasUnreadSubwaves = false,
}: CollapsedWaveProps) => {
  const linkLabel = getCollapsedWaveLinkLabel({
    formattedWaveName,
    haveNewDrops,
    isActive,
    hasUnreadSubwaves,
    wave,
  });

  return (
    <div
      className={`tw-group tw-flex tw-items-center tw-justify-center tw-py-2 tw-transition-colors tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/70"
      }`}
    >
      <Link
        href={href}
        prefetch={false}
        aria-label={linkLabel}
        {...(onMouseEnter ? { onMouseEnter } : {})}
        onClick={onClick}
        className="tw-flex tw-items-center tw-justify-center tw-no-underline"
        {...(showTooltip ? { "data-tooltip-id": tooltipId } : {})}
      >
        <div className="tw-relative">
          <WaveAvatar
            isActive={isActive}
            isDropWave={isDropWave}
            showNewDropsBadge={!isActive && haveNewDrops}
            wave={wave}
          />
          {hasUnreadSubwaves && (
            <span
              aria-hidden="true"
              className="tw-absolute tw-right-[-3px] tw-top-[-3px] tw-size-2.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-primary-400"
            />
          )}
        </div>
      </Link>
      {showTooltip && (
        <WaveTooltip id={tooltipId} place={tooltipPlacement}>
          {formattedWaveName}
        </WaveTooltip>
      )}
    </div>
  );
};
