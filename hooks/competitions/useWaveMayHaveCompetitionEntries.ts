"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeToWaveCompetitionPresence,
  waveMayHaveCompetitionEntries,
} from "@/helpers/waves/wave-competition-presence";

const getServerSnapshot = (): boolean => true;

/** False only once the API has said the wave has no competition. */
export function useWaveMayHaveCompetitionEntries(waveId: string): boolean {
  return useSyncExternalStore(
    subscribeToWaveCompetitionPresence,
    () => waveMayHaveCompetitionEntries(waveId),
    getServerSnapshot
  );
}
