import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveMuteSettings } from "./useWaveMuteSettings";
import { useWavePreferenceSettings } from "./useWavePreferenceSettings";

export function useWaveNotificationSettings(wave: ApiWave) {
  const mute = useWaveMuteSettings(wave);
  const preferences = useWavePreferenceSettings(wave);
  const following = wave.subscribed_actions.length > 0;

  return {
    following,
    ...mute,
    ...preferences,
  };
}

export type WaveNotificationSettingsState = ReturnType<
  typeof useWaveNotificationSettings
>;
