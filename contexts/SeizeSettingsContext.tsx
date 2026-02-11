"use client";

import { publicEnv } from "@/config/env";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiSeizeSettings } from "@/generated/models/ApiSeizeSettings";
import { fetchUrl } from "@/services/6529api";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SeizeSettingsContextType = {
  seizeSettings: ApiSeizeSettings;
  isMemesWave: (waveId: string | undefined | null) => boolean;
  isMemesSubmission: (drop: ApiDrop | undefined | null) => boolean;
  // True once at least one fetch succeeds; stays true during background refreshes
  // unless callers opt into reset=true before reloading.
  isLoaded: boolean;
  loadError: Error | null;
  loadSeizeSettings: (options?: {
    reset?: boolean | undefined;
  }) => Promise<void>;
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
    distribution_admin_wallets: [],
    claims_admin_wallets: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadSeizeSettings = useCallback(
    async ({ reset = false }: { reset?: boolean | undefined } = {}) => {
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
        // Keep isLoaded true during background refreshes unless reset was requested
        if (reset) {
          setIsLoaded(false);
        }
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

  const isMemesSubmission = useCallback(
    (drop: ApiDrop | undefined | null): boolean => {
      if (!drop) return false;
      return (
        isMemesWave(drop?.wave?.id) &&
        (drop.drop_type === ApiDropType.Participatory ||
          drop.drop_type === ApiDropType.Winner)
      );
    },
    [isMemesWave]
  );

  const value: SeizeSettingsContextType = useMemo(
    () => ({
      seizeSettings,
      isMemesWave,
      isMemesSubmission,
      isLoaded,
      loadError,
      loadSeizeSettings,
    }),
    [
      seizeSettings,
      isMemesWave,
      isMemesSubmission,
      isLoaded,
      loadError,
      loadSeizeSettings,
    ]
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
