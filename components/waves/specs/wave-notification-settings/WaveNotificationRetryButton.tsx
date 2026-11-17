import Button from "@/components/utils/button/Button";
import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";
import { waveNotificationSettingsMessage } from "./waveNotificationSettings.messages";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationRetryButtonProps {
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

export default function WaveNotificationRetryButton({
  settings,
  compact = false,
}: WaveNotificationRetryButtonProps) {
  return (
    <div className={compact ? "tw-inline-flex" : "tw-w-full"}>
      <Button
        onClick={settings.onRetryClick}
        loading={settings.preferencesFetching}
        variant="tertiary"
        size={compact ? "xs" : "md"}
        className={compact ? COMPACT_ACTION_TOUCH_TARGET_CLASS : undefined}
        fullWidth={!compact}
        aria-label={waveNotificationSettingsMessage(
          "waves.notificationSettings.retry.ariaLabel"
        )}
      >
        {waveNotificationSettingsMessage(
          "waves.notificationSettings.retry.label"
        )}
      </Button>
    </div>
  );
}
