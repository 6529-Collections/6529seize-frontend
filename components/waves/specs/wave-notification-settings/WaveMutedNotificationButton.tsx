import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import IconButton from "@/components/utils/button/IconButton";
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

  return (
    <div className={compact ? "tw-inline-flex" : "tw-w-full"}>
      <IconButton
        type="button"
        disabled={settings.muteLoading}
        onClick={settings.onMuteClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={settings.muteTooltip}
        layout={compact ? "notification-mute" : "notification-mute-wide"}
        variant={settings.isMuted ? "selected" : "ghost"}
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
      </IconButton>
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
