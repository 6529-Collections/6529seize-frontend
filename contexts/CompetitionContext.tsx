"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import type { ApiWave } from "@/generated/models/ApiWave";

interface CompetitionContextValue {
  readonly wave: ApiWave;
  readonly hub: ApiWaveV3;
  readonly competition: ApiCompetition;
}
const CompetitionContext = createContext<CompetitionContextValue | null>(null);
export function CompetitionProvider({
  value,
  children,
}: {
  readonly value: CompetitionContextValue;
  readonly children: ReactNode;
}) {
  if (
    value.wave.id !== value.competition.wave_id ||
    value.hub.id !== value.wave.id
  )
    throw new Error("Invalid competition parent");
  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
}
export function useCompetition() {
  const context = useContext(CompetitionContext);
  if (!context) throw new Error("Competition provider is required");
  return context;
}
