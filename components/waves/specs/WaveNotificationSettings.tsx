"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import WaveNotificationPreferenceButtons from "./wave-notification-settings/WaveNotificationPreferenceButtons";
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
  return (
    <WaveNotificationPreferenceButtons
      waveId={wave.id}
      settings={settings}
      compact={compact}
    />
  );
}
