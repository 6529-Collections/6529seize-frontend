import { Spinner } from "@/components/dotLoader/DotLoader";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveMutedNotificationButtonProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
}

export default function WaveMutedNotificationButton({
  waveId,
  settings,
}: WaveMutedNotificationButtonProps) {
  return (
    <div className="tw-w-full">
      <OverlayTrigger
        overlay={
          <Tooltip id={`mute-tooltip-${waveId}`} placement="top">
            {settings.muteTooltip}
          </Tooltip>
        }
      >
        <button
          disabled={settings.muteLoading}
          onClick={settings.onMuteClick}
          className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-text-xs tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300 lg:tw-h-9"
          aria-label="Unmute wave"
        >
          {settings.muteLoading ? (
            <Spinner dimension={14} />
          ) : (
            <>
              <FontAwesomeIcon
                icon={faBellSlash}
                className="tw-size-3.5 tw-flex-shrink-0"
              />
              <span>Muted</span>
            </>
          )}
        </button>
      </OverlayTrigger>
    </div>
  );
}
