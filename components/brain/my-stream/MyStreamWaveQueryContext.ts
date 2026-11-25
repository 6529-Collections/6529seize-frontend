"use client";

import { createContext, useContext } from "react";
import type { useWaveData } from "@/hooks/useWaveData";

type MyStreamWaveQuery = ReturnType<typeof useWaveData>;

/**
 * The wave's query, which MyStreamWave runs above the wave's move scope so
 * the view's own checks see whether its wave moves.
 */
export const MyStreamWaveQueryContext = createContext<MyStreamWaveQuery | null>(
  null
);

/** The query MyStreamWave runs for the wave view inside it. */
export function useMyStreamWaveQuery(): MyStreamWaveQuery {
  const query = useContext(MyStreamWaveQueryContext);
  if (query === null) {
    throw new Error("The wave view renders inside MyStreamWave.");
  }
  return query;
}
