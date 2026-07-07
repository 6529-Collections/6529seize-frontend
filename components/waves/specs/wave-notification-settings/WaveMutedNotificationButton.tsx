import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { SpeakerXMarkIcon as SpeakerXMarkOutlineIcon } from "@heroicons/react/24/outline";
import { SpeakerXMarkIcon as SpeakerXMarkSolidIcon } from "@heroicons/react/24/solid";
import { waveNotificationSettingsMessage } from "./waveNotificationSettings.messages";
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
  const ariaLabel = settings.isMuted
    ? waveNotificationSettingsMessage(
        "waves.notificationSettings.mute.unmuteAriaLabel"
      )
    : waveNotificationSettingsMessage(
        "waves.notificationSettings.mute.ariaLabel"
      );
  const textLabel = settings.isMuted
    ? waveNotificationSettingsMessage(
        "waves.notificationSettings.mute.activeLabel"
      )
    : waveNotificationSettingsMessage("waves.notificationSettings.mute.label");
  const Icon = settings.isMuted
    ? SpeakerXMarkSolidIcon
    : SpeakerXMarkOutlineIcon;
  const stateClasses = settings.isMuted
    ? "tw-border-error/40 tw-bg-error/10 tw-text-error desktop-hover:hover:tw-bg-error/15 desktop-hover:hover:tw-text-error"
    : "tw-border-iron-700 tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";

  return (
    <div className={compact ? "tw-inline-flex" : "tw-w-full"}>
      <button
        type="button"
        disabled={settings.muteLoading}
        onClick={settings.onMuteClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={settings.muteTooltip}
        className={`tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-text-[13px] tw-font-semibold tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed ${stateClasses} ${
          compact
            ? "tw-size-9 tw-gap-0 tw-px-0"
            : "tw-h-10 tw-w-full tw-gap-2 tw-px-3 lg:tw-h-9"
        }`}
        aria-label={ariaLabel}
      >
        {settings.muteLoading ? (
          <Spinner dimension={14} />
        ) : (
          <>
            <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
            {!compact && <span>{textLabel}</span>}
          </>
        )}
      </button>
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
