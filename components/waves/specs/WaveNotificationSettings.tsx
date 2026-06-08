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

  if (!settings.following) {
    return null;
  }

  if (settings.isMuted) {
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
      <WaveNotificationRetryButton settings={settings} compact={compact} />
    );
  }

  return (
    <WaveNotificationPreferenceButtons
      waveId={wave.id}
      settings={settings}
      compact={compact}
    />
  );
}
