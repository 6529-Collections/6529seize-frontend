import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveMutedNotificationButtonProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

export default function WaveMutedNotificationButton({
  waveId,
  settings,
  compact = false,
}: WaveMutedNotificationButtonProps) {
  const tooltipId = `wave-notification-muted-${waveId}`;

  return (
    <div className={compact ? "tw-inline-flex" : "tw-w-full"}>
      <button
        disabled={settings.muteLoading}
        onClick={settings.onMuteClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={settings.muteTooltip}
        className={`tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-[13px] tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300 ${
          compact
            ? "tw-size-9 tw-gap-0 tw-px-0"
            : "tw-h-10 tw-w-full tw-gap-2 tw-px-3 lg:tw-h-9"
        }`}
        aria-label="Unmute wave"
      >
        {settings.muteLoading ? (
          <Spinner dimension={14} />
        ) : (
          <>
            <FontAwesomeIcon
              icon={faBellSlash}
              className="tw-size-4 tw-flex-shrink-0"
            />
            {!compact && <span>Muted</span>}
          </>
        )}
      </button>
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
