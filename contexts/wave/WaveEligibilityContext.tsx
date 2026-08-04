"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
} from "react";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ChatRestriction } from "@/hooks/useDropPriviledges";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

export interface WaveEligibility {
  authenticated_user_eligible_to_chat: boolean;
  authenticated_user_chat_restriction?: ChatRestriction | null;
  authenticated_user_eligible_to_vote: boolean;
  authenticated_user_eligible_to_participate: boolean;
  authenticated_user_admin: boolean;
  lastUpdated: number;
}

interface WaveEligibilityContextType {
  eligibility: Record<string, WaveEligibility>;
  updateEligibility: (
    waveId: string,
    eligibility: Partial<WaveEligibility>
  ) => void;
  refreshEligibility: (waveId: string) => Promise<void>;
  getEligibility: (waveId: string) => WaveEligibility | null;
}

const WaveEligibilityContext = createContext<WaveEligibilityContextType | null>(
  null
);

export const useWaveEligibility = () => {
  const context = useContext(WaveEligibilityContext);
  if (!context) {
    // For backwards compatibility in tests, return a mock implementation
    console.warn("useWaveEligibility used outside of provider, using fallback");
    return {
      eligibility: {},
      updateEligibility: () => {},
      refreshEligibility: async () => {},
      getEligibility: () => null,
    };
  }
  return context;
};

interface WaveEligibilityProviderProps {
  children: React.ReactNode;
}

export const WaveEligibilityProvider: React.FC<
  WaveEligibilityProviderProps
> = ({ children }) => {
  const [eligibility, setEligibility] = useState<
    Record<string, WaveEligibility>
  >({});
  const eligibilityRef = useRef<Record<string, WaveEligibility>>({});
  const refreshingRef = useRef<Map<string, number>>(new Map());
  const profileGenerationRef = useRef(0);

  useEffect(() => {
    const handleProfileSwitch = () => {
      profileGenerationRef.current += 1;
      refreshingRef.current.clear();
      eligibilityRef.current = {};
      setEligibility({});
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, handleProfileSwitch);
    return () =>
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        handleProfileSwitch
      );
  }, []);

  const updateEligibility = useCallback(
    (waveId: string, newEligibility: Partial<WaveEligibility>) => {
      const updatesRawEligibility =
        "authenticated_user_eligible_to_chat" in newEligibility ||
        "authenticated_user_eligible_to_vote" in newEligibility ||
        "authenticated_user_eligible_to_participate" in newEligibility ||
        "authenticated_user_admin" in newEligibility;

      const previous = eligibilityRef.current;
      const next = {
        ...previous,
        [waveId]: {
          ...previous[waveId],
          ...newEligibility,
          lastUpdated: updatesRawEligibility
            ? Date.now()
            : (previous[waveId]?.lastUpdated ?? 0),
        } as WaveEligibility,
      };
      eligibilityRef.current = next;
      setEligibility(next);
    },
    []
  );

  const refreshEligibility = useCallback(
    async (waveId: string) => {
      // Prevent multiple concurrent refreshes for the same wave
      const profileGeneration = profileGenerationRef.current;
      if (refreshingRef.current.get(waveId) === profileGeneration) {
        return;
      }

      // Check if data is recent (less than 5 minutes old)
      const existing = eligibilityRef.current[waveId];
      if (existing && Date.now() - existing.lastUpdated < 5 * 60 * 1000) {
        return;
      }

      refreshingRef.current.set(waveId, profileGeneration);

      try {
        const wave = await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
        });

        if (profileGeneration !== profileGenerationRef.current) {
          return;
        }

        updateEligibility(waveId, {
          authenticated_user_eligible_to_chat:
            wave.chat.authenticated_user_eligible,
          authenticated_user_eligible_to_vote:
            wave.voting.authenticated_user_eligible,
          authenticated_user_eligible_to_participate:
            wave.participation.authenticated_user_eligible,
          authenticated_user_admin: false, // This needs to be obtained from drops, not main wave object
        });
      } catch (error) {
        // Silently fail - keep existing eligibility data
        console.warn(
          `Failed to refresh eligibility for wave ${waveId}:`,
          error
        );
      } finally {
        if (refreshingRef.current.get(waveId) === profileGeneration) {
          refreshingRef.current.delete(waveId);
        }
      }
    },
    [updateEligibility]
  );

  const getEligibility = useCallback(
    (waveId: string): WaveEligibility | null => {
      return eligibility[waveId] ?? null;
    },
    [eligibility]
  );

  const value: WaveEligibilityContextType = useMemo(
    () => ({
      eligibility,
      updateEligibility,
      refreshEligibility,
      getEligibility,
    }),
    [eligibility, updateEligibility, refreshEligibility, getEligibility]
  );

  return (
    <WaveEligibilityContext.Provider value={value}>
      {children}
    </WaveEligibilityContext.Provider>
  );
};
