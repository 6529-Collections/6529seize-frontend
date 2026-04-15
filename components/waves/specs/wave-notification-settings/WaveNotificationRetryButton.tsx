import { Spinner } from "@/components/dotLoader/DotLoader";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationRetryButtonProps {
  readonly settings: WaveNotificationSettingsState;
}

export default function WaveNotificationRetryButton({
  settings,
}: WaveNotificationRetryButtonProps) {
  return (
    <div className="tw-w-full">
      <button
        type="button"
        disabled={settings.preferencesFetching}
        onClick={settings.onRetryClick}
        className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-text-xs tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 lg:tw-h-9"
        aria-label="Retry notification settings"
      >
        {settings.preferencesFetching ? (
          <Spinner dimension={12} />
        ) : (
          <span>Retry</span>
        )}
      </button>
    </div>
  );
}
