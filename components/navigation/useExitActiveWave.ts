"use client";

import { useCallback } from "react";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useViewContext } from "./ViewContext";

export function useExitActiveWave() {
  const myStream = useMyStreamOptional();
  const { clearLastVisited } = useViewContext();
  const setActiveWave = myStream?.activeWave.set;

  return useCallback(
    (isDirectMessage: boolean) => {
      clearLastVisited(isDirectMessage ? "dm" : "wave");
      setActiveWave?.(null, { isDirectMessage });
    },
    [clearLastVisited, setActiveWave]
  );
}
