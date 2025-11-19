"use client";

import { publicEnv } from "@/config/env";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiSeizeSettings } from "@/generated/models/ApiSeizeSettings";
import { fetchUrl } from "@/services/6529api";

type SeizeSettingsContextType = {
  seizeSettings: ApiSeizeSettings;
  isMemesWave: (waveId: string | undefined | null) => boolean;
  // True once at least one fetch succeeds; stays true during background refreshes
  // unless callers opt into reset=true before reloading.
  isLoaded: boolean;
  loadError: Error | null;
  loadSeizeSettings: (options?: { reset?: boolean }) => Promise<void>;
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
  const isMountedRef = useRef(true);

  const loadSeizeSettings = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (reset && isMountedRef.current) {
        setIsLoaded(false);
        setLoadError(null);
      }

      try {
        const settings = await fetchUrl<ApiSeizeSettings>(
          `${publicEnv.API_ENDPOINT}/api/settings`
        );

        if (!isMountedRef.current) return;

        setSeizeSettings({
          ...settings,
          memes_wave_id:
            publicEnv.DEV_MODE_MEMES_WAVE_ID ?? settings.memes_wave_id,
        });
        setLoadError(null);
        setIsLoaded(true);
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error("Failed to fetch seize settings", error);
        const normalizedError =
          error instanceof Error ? error : new Error(String(error));
        setLoadError(normalizedError);
        setIsLoaded(false);
        throw normalizedError;
      }
    },
    []
  );

  useEffect(() => {
    loadSeizeSettings();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSeizeSettings]);

  const { memes_wave_id } = seizeSettings;

  const isMemesWave = useCallback(
    (waveId: string | undefined | null): boolean => {
      if (!waveId) return false;
      return memes_wave_id === waveId;
    },
    [memes_wave_id]
  );

  const value: SeizeSettingsContextType = useMemo(
    () => ({
      seizeSettings,
      isMemesWave,
      isLoaded,
      loadError,
      loadSeizeSettings,
    }),
    [seizeSettings, isMemesWave, isLoaded, loadError, loadSeizeSettings]
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
