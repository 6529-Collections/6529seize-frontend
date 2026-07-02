"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import WaveMutedNotificationButton from "./wave-notification-settings/WaveMutedNotificationButton";
import WaveNotificationPreferenceButtons from "./wave-notification-settings/WaveNotificationPreferenceButtons";
import WaveNotificationRetryButton from "./wave-notification-settings/WaveNotificationRetryButton";
import { useWaveNotificationSettings } from "./wave-notification-settings/useWaveNotificationSettings";

interface WaveRatingProps {
  readonly wave: ApiWave;
  readonly compact?: boolean | undefined;
}

export default function WaveNotificationSettings({
  wave,
  compact = false,
}: WaveRatingProps) {
  const settings = useWaveNotificationSettings(wave);

  if (!settings.following || settings.isMuted) {
    return (
      <WaveMutedNotificationButton
        waveId={wave.id}
        settings={settings}
        compact={compact}
      />
    );
  }

  if (settings.preferencesUnavailable) {
    return (
      <div
        className={
          compact
            ? "tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs"
            : "tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-1.5 tw-text-xs"
        }
      >
        <WaveNotificationRetryButton settings={settings} compact={compact} />
        <WaveMutedNotificationButton
          waveId={wave.id}
          settings={settings}
          compact={compact}
        />
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs"
          : "tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-1.5 tw-text-xs"
      }
    >
      <WaveNotificationPreferenceButtons
        waveId={wave.id}
        settings={settings}
        compact={compact}
      />
      <WaveMutedNotificationButton
        waveId={wave.id}
        settings={settings}
        compact={compact}
      />
    </div>
  );
}
