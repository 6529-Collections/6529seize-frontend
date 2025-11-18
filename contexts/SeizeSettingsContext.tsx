"use client";

import { publicEnv } from "@/config/env";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiSeizeSettings } from "@/generated/models/ApiSeizeSettings";
import { fetchUrl } from "@/services/6529api";

type SeizeSettingsContextType = {
  seizeSettings: ApiSeizeSettings;
  isMemesWave: (waveId: string | undefined | null) => boolean;
  // True only after the latest fetch succeeds; failed loads leave this false.
  isLoaded: boolean;
  loadError: Error | null;
};

const SeizeSettingsContext = createContext<
  SeizeSettingsContextType | undefined
>(undefined);

export const SeizeSettingsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [seizeSettings, setSeizeSettings] = useState<ApiSeizeSettings>({
    rememes_submission_tdh_threshold: 0,
    all_drops_notifications_subscribers_limit: 0,
    memes_wave_id: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchUrl<ApiSeizeSettings>(`${publicEnv.API_ENDPOINT}/api/settings`)
      .then((settings) => {
        if (!isMounted) return;
        setSeizeSettings({
          ...settings,
          memes_wave_id:
            publicEnv.DEV_MODE_MEMES_WAVE_ID ?? settings.memes_wave_id,
        });
        setLoadError(null);
        setIsLoaded(true);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to fetch seize settings", error);
        setLoadError(error instanceof Error ? error : new Error(String(error)));
        setIsLoaded(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isMemesWave = useCallback(
    (waveId: string | undefined | null): boolean => {
      if (!waveId) return false;
      return seizeSettings.memes_wave_id === waveId;
    },
    [seizeSettings.memes_wave_id]
  );

  const value: SeizeSettingsContextType = useMemo(
    () => ({
      seizeSettings,
      isMemesWave,
      isLoaded,
      loadError,
    }),
    [seizeSettings, isMemesWave, isLoaded, loadError]
  );

  return (
    <SeizeSettingsContext.Provider value={value}>
      {children}
    </SeizeSettingsContext.Provider>
  );
};

export const useSeizeSettings = (): SeizeSettingsContextType => {
  const context = useContext(SeizeSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSeizeSettings must be used within a SeizeSettingsProvider"
    );
  }
  return context;
};
