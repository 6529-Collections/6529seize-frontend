import { Spinner } from "@/components/dotLoader/DotLoader";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationPreferenceButtonsProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
}

const getButtonStyle = (active: boolean) => {
  return active
    ? "tw-bg-iron-800 tw-text-primary-400 tw-font-medium"
    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent";
};

function getAllDropsButtonStyle(settings: WaveNotificationSettingsState) {
  const buttonStyle = getButtonStyle(settings.allDropsEnabled);
  return settings.disableAllDropsSelection && !settings.allDropsEnabled
    ? `${buttonStyle} tw-cursor-not-allowed`
    : buttonStyle;
}

function AllDropsIcon({ className }: { readonly className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
      />
    </svg>
  );
}

export default function WaveNotificationPreferenceButtons({
  waveId,
  settings,
}: WaveNotificationPreferenceButtonsProps) {
  const allDropsSelectionDisabled =
    settings.disableAllDropsSelection && !settings.allDropsEnabled;
  const allDropsTooltipId = `all-drops-tooltip-${waveId}`;
  const allDropsDisabledDescriptionId = `${allDropsTooltipId}-disabled-description`;
  const allDropsButton = (
    <button
      type="button"
      disabled={settings.loading}
      aria-disabled={allDropsSelectionDisabled || undefined}
      aria-describedby={
        allDropsSelectionDisabled ? allDropsDisabledDescriptionId : undefined
      }
      onClick={
        allDropsSelectionDisabled
          ? undefined
          : settings.onAllDropsNotificationsClick
      }
      className={`tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-2.5 tw-py-2 tw-transition tw-duration-300 tw-ease-out lg:tw-h-9 ${getAllDropsButtonStyle(settings)}`}
      aria-label="Receive all drop notifications"
    >
      {settings.loadingTarget === "all-drops" ? (
        <Spinner dimension={12} />
      ) : (
        <AllDropsIcon className="tw-size-4 tw-flex-shrink-0" />
      )}
      {allDropsSelectionDisabled && (
        <span id={allDropsDisabledDescriptionId} className="tw-sr-only">
          {settings.allDropsTooltip}
        </span>
      )}
    </button>
  );

  return (
    <div className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-1.5 tw-text-xs">
      <OverlayTrigger
        overlay={
          <Tooltip id={`all-group-tooltip-${waveId}`} placement="top">
            {settings.allGroupTooltip}
          </Tooltip>
        }
      >
        <button
          disabled={settings.loading}
          onClick={settings.onAllGroupNotificationsClick}
          className={`tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-2.5 tw-py-2 tw-transition tw-duration-300 tw-ease-out lg:tw-h-9 ${getButtonStyle(settings.allGroupNotificationsEnabled)}`}
          aria-label="Receive ALL mention notifications"
        >
          {settings.loadingTarget === "all-group" ? (
            <Spinner dimension={12} />
          ) : (
            <span>@ALL</span>
          )}
        </button>
      </OverlayTrigger>

      <OverlayTrigger
        overlay={
          <Tooltip id={allDropsTooltipId} placement="top">
            {settings.allDropsTooltip}
          </Tooltip>
        }
      >
        {allDropsButton}
      </OverlayTrigger>
    </div>
  );
}
