"use client"

import React, { createContext, useContext, useCallback, useState, useRef, useMemo } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import { ApiWave } from "../../generated/models/ApiWave";

interface WaveEligibility {
  authenticated_user_eligible_to_chat: boolean;
  authenticated_user_eligible_to_vote: boolean;
  authenticated_user_eligible_to_participate: boolean;
  authenticated_user_admin: boolean;
  lastUpdated: number;
}

interface WaveEligibilityContextType {
  eligibility: Record<string, WaveEligibility>;
  updateEligibility: (waveId: string, eligibility: Partial<WaveEligibility>) => void;
  refreshEligibility: (waveId: string) => Promise<void>;
  getEligibility: (waveId: string) => WaveEligibility | null;
}

const WaveEligibilityContext = createContext<WaveEligibilityContextType | null>(null);

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

export const WaveEligibilityProvider: React.FC<WaveEligibilityProviderProps> = ({ children }) => {
  const [eligibility, setEligibility] = useState<Record<string, WaveEligibility>>({});
  const refreshingRef = useRef<Set<string>>(new Set());

  const updateEligibility = useCallback((waveId: string, newEligibility: Partial<WaveEligibility>) => {
    setEligibility(prev => ({
      ...prev,
      [waveId]: {
        ...prev[waveId],
        ...newEligibility,
        lastUpdated: Date.now(),
      } as WaveEligibility
    }));
  }, []);

  const refreshEligibility = useCallback(async (waveId: string) => {
    // Prevent multiple concurrent refreshes for the same wave
    if (refreshingRef.current.has(waveId)) {
      return;
    }

    // Check if data is recent (less than 5 minutes old)
    const existing = eligibility[waveId];
    if (existing && (Date.now() - existing.lastUpdated) < 5 * 60 * 1000) {
      return;
    }

    refreshingRef.current.add(waveId);

    try {
      const wave = await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });

      if (wave) {
        updateEligibility(waveId, {
          authenticated_user_eligible_to_chat: wave.chat.authenticated_user_eligible,
          authenticated_user_eligible_to_vote: wave.participation.authenticated_user_eligible,
          authenticated_user_eligible_to_participate: wave.participation.authenticated_user_eligible,
          authenticated_user_admin: false, // This needs to be obtained from drops, not main wave object
        });
      }
    } catch (error) {
      // Silently fail - keep existing eligibility data
      console.warn(`Failed to refresh eligibility for wave ${waveId}:`, error);
    } finally {
      refreshingRef.current.delete(waveId);
    }
  }, [eligibility, updateEligibility]);

  const getEligibility = useCallback((waveId: string): WaveEligibility | null => {
    return eligibility[waveId] ?? null;
  }, [eligibility]);

  const value: WaveEligibilityContextType = useMemo(() => ({
    eligibility,
    updateEligibility,
    refreshEligibility,
    getEligibility,
  }), [eligibility, updateEligibility, refreshEligibility, getEligibility]);

  return (
    <WaveEligibilityContext.Provider value={value}>
      {children}
    </WaveEligibilityContext.Provider>
  );
};