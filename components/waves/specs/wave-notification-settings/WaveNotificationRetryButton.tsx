import { Spinner } from "@/components/dotLoader/DotLoader";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationRetryButtonProps {
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

export default function WaveNotificationRetryButton({
  settings,
  compact = false,
}: WaveNotificationRetryButtonProps) {
  let buttonContent = <span>Retry</span>;

  if (settings.preferencesFetching) {
    buttonContent = <Spinner dimension={12} />;
  }

  return (
    <div className={compact ? "tw-inline-flex" : "tw-w-full"}>
      <button
        type="button"
        disabled={settings.preferencesFetching}
        onClick={settings.onRetryClick}
        className={`tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-[13px] tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 ${
          compact ? "tw-h-9 tw-px-3" : "tw-h-10 tw-w-full tw-px-3 lg:tw-h-9"
        }`}
        aria-label="Retry notification settings"
      >
        {buttonContent}
      </button>
    </div>
  );
}
