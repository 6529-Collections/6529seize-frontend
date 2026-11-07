"use client";

import { useCallback } from "react";
import { useActiveWaveOptional } from "@/contexts/wave/ActiveWaveContext";
import { useViewContext } from "./ViewContext";

export function useExitActiveWave() {
  const activeWave = useActiveWaveOptional();
  const { clearLastVisited } = useViewContext();
  const setActiveWave = activeWave?.set;

  return useCallback(
    (isDirectMessage: boolean) => {
      clearLastVisited(isDirectMessage ? "dm" : "wave");
      setActiveWave?.(null, { isDirectMessage });
    },
    [clearLastVisited, setActiveWave]
  );
}
