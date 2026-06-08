import { Spinner } from "@/components/dotLoader/DotLoader";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import { AtSymbolIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationPreferenceButtonsProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

const getButtonStyle = (active: boolean) => {
  return active
    ? "tw-bg-primary-400/10 tw-border-primary-400/30 tw-text-primary-400 desktop-hover:tw-hover:tw-bg-primary-400/20"
    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent tw-border-iron-700";
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
  compact = false,
}: WaveNotificationPreferenceButtonsProps) {
  const allDropsSelectionDisabled =
    settings.disableAllDropsSelection && !settings.allDropsEnabled;
  const tooltipId = `wave-notification-actions-${waveId}`;
  const allDropsDisabledDescriptionId = `${tooltipId}-all-drops-disabled-description`;
  const allDropsButtonSizeClass = compact
    ? "tw-size-9 tw-p-0"
    : "tw-h-10 tw-w-full tw-px-2.5 tw-py-2 lg:tw-h-9";
  const allGroupButtonSizeClass = compact
    ? "tw-h-9 tw-min-w-9 tw-gap-0 tw-px-2"
    : "tw-h-10 tw-w-full tw-px-2.5 tw-py-2 lg:tw-h-9";

  let allDropsButtonContent = (
    <AllDropsIcon className="tw-size-4 tw-flex-shrink-0" />
  );
  if (settings.loadingTarget === "all-drops") {
    allDropsButtonContent = <Spinner dimension={12} />;
  } else if (allDropsSelectionDisabled) {
    allDropsButtonContent = (
      <BellSlashIcon className="tw-size-4 tw-flex-shrink-0" />
    );
  }

  const allDropsButton = (
    <button
      type="button"
      disabled={settings.loading}
      aria-disabled={allDropsSelectionDisabled || undefined}
      aria-describedby={
        allDropsSelectionDisabled ? allDropsDisabledDescriptionId : undefined
      }
      data-tooltip-id={tooltipId}
      data-tooltip-content={settings.allDropsTooltip}
      onClick={
        allDropsSelectionDisabled
          ? undefined
          : settings.onAllDropsNotificationsClick
      }
      className={`tw-flex ${allDropsButtonSizeClass} tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out ${getAllDropsButtonStyle(settings)}`}
      aria-label="Receive all drop notifications"
    >
      {allDropsButtonContent}
      {allDropsSelectionDisabled && (
        <span id={allDropsDisabledDescriptionId} className="tw-sr-only">
          {settings.allDropsTooltip}
        </span>
      )}
    </button>
  );

  return (
    <div
      className={
        compact
          ? "tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs"
          : "tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-1.5 tw-text-xs"
      }
    >
      <button
        disabled={settings.loading}
        onClick={settings.onAllGroupNotificationsClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={settings.allGroupTooltip}
        className={`tw-flex ${allGroupButtonSizeClass} tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-transition tw-duration-300 tw-ease-out ${getButtonStyle(settings.allGroupNotificationsEnabled)}`}
        aria-label="Receive ALL mention notifications"
      >
        {settings.loadingTarget === "all-group" ? (
          <Spinner dimension={12} />
        ) : (
          <>
            <AtSymbolIcon className="tw-size-4 tw-flex-shrink-0" />
            <span className="-tw-ml-0.5">ALL</span>
          </>
        )}
      </button>

      {allDropsButton}
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
