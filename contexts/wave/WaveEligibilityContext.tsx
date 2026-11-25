"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { useAuth } from "@/components/auth/authContext";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ChatRestriction } from "@/hooks/useDropPriviledges";

export interface WaveEligibility {
  authenticated_user_eligible_to_chat: boolean;
  /** Replying can be open to people who can't start new chat drops. */
  authenticated_user_eligible_to_reply?: boolean | undefined;
  authenticated_user_chat_restriction?: ChatRestriction | null;
  authenticated_user_eligible_to_vote: boolean;
  authenticated_user_eligible_to_participate: boolean;
  authenticated_user_admin: boolean;
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

type EligibilityUpdate = Partial<WaveEligibility>;

const RAW_ELIGIBILITY_KEYS = [
  "authenticated_user_eligible_to_chat",
  "authenticated_user_eligible_to_reply",
  "authenticated_user_eligible_to_vote",
  "authenticated_user_eligible_to_participate",
  "authenticated_user_admin",
] as const satisfies readonly (keyof WaveEligibility)[];

const ELIGIBILITY_FRESH_MS = 5 * 60 * 1000;
const EMPTY_ELIGIBILITY: Record<string, WaveEligibility> = {};

const updatesRawEligibility = (update: EligibilityUpdate): boolean =>
  RAW_ELIGIBILITY_KEYS.some((key) => key in update);

// Every wave feed page and refetch re-reports eligibility. Unchanged values
// must keep the same state object, or every drop's reaction and reply
// controls re-render with the page.
const changesEligibility = (
  current: WaveEligibility | undefined,
  update: EligibilityUpdate
): boolean => {
  if (!current) return true;
  return Object.entries(update).some(
    ([key, value]) => !Object.is(current[key as keyof WaveEligibility], value)
  );
};

export const WaveEligibilityProvider: React.FC<
  WaveEligibilityProviderProps
> = ({ children }) => {
  const {
    connectedProfile,
    activeProfileProxy,
    isAuthenticated,
    isDirectProfileSession,
  } = useAuth();
  const scopeKey = JSON.stringify([
    connectedProfile?.id,
    activeProfileProxy?.id,
    isAuthenticated,
    isDirectProfileSession,
  ]);
  const [scopedState, setScopedState] = useState({
    scopeKey,
    epoch: 0,
    eligibility: {} as Record<string, WaveEligibility>,
  });
  if (scopedState.scopeKey !== scopeKey) {
    setScopedState({ scopeKey, epoch: scopedState.epoch + 1, eligibility: {} });
  }
  const { epoch } = scopedState;
  const eligibility =
    scopedState.scopeKey === scopeKey
      ? scopedState.eligibility
      : EMPTY_ELIGIBILITY;
  const refreshingRef = useRef<Set<string>>(new Set());
  // When the server last confirmed each wave's eligibility, changed or not.
  // The only freshness record: kept out of state so confirmations alone do
  // not re-render consumers. One entry per visited wave, like `eligibility`.
  const confirmedAtRef = useRef<Map<string, number>>(new Map());

  const activeEpochRef = useRef(epoch);
  useLayoutEffect(() => {
    activeEpochRef.current = epoch;
    confirmedAtRef.current.clear();
    refreshingRef.current.clear();
  }, [epoch]);

  const updateEligibility = useCallback(
    (waveId: string, newEligibility: EligibilityUpdate) => {
      if (activeEpochRef.current !== epoch) return;
      if (updatesRawEligibility(newEligibility)) {
        confirmedAtRef.current.set(`${epoch}:${waveId}`, Date.now());
      }

      setScopedState((prev) => {
        if (prev.scopeKey !== scopeKey || prev.epoch !== epoch) return prev;
        const current = prev.eligibility[waveId];
        if (!changesEligibility(current, newEligibility)) {
          return prev;
        }
        return {
          ...prev,
          eligibility: {
            ...prev.eligibility,
            [waveId]: { ...current, ...newEligibility } as WaveEligibility,
          },
        };
      });
    },
    [epoch, scopeKey]
  );

  const refreshEligibility = useCallback(
    async (waveId: string) => {
      const refreshKey = `${epoch}:${waveId}`;
      // Requests and freshness belong to the actor that started them.
      if (refreshingRef.current.has(refreshKey)) {
        return;
      }

      // Check if data is recent (less than 5 minutes old)
      const confirmedAt = confirmedAtRef.current.get(refreshKey);
      if (
        confirmedAt !== undefined &&
        Date.now() - confirmedAt < ELIGIBILITY_FRESH_MS
      ) {
        return;
      }

      refreshingRef.current.add(refreshKey);

      try {
        const wave = await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
        });

        updateEligibility(waveId, {
          authenticated_user_eligible_to_chat:
            wave.chat.authenticated_user_eligible,
          authenticated_user_eligible_to_reply:
            wave.chat.replies?.authenticated_user_eligible ??
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
        refreshingRef.current.delete(refreshKey);
      }
    },
    [epoch, updateEligibility]
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
