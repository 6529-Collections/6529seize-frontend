"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  rememberDropWave,
  rememberWaveMove,
  waveMoveSignal,
} from "@/lib/waves-move/scope";

/**
 * Whether the wave a part of the page belongs to moves to the 6529 Network:
 * "moves", "stays", or "none" outside any wave (the waves list, creating a
 * wave), where the move's site-wide pause applies.
 */
type WavesMoveScopeValue = "moves" | "stays" | "none";

const WavesMoveScopeContext = createContext<WavesMoveScopeValue>("none");

/** The move's scope where a control is: its wave's, or "none". */
export function useWavesMoveScope(): WavesMoveScopeValue {
  return useContext(WavesMoveScopeContext);
}

/**
 * Scopes the notice and the paused writes inside to one wave: a wave the
 * API says stays on 6529.io pauses nothing and shows no notice. A wave
 * whose object doesn't say keeps the scope around it, or stays when there
 * is none. Without a wave id it changes nothing. `dropId` lets the request
 * guard tell a drop's wave later.
 */
export function WavesMoveScope({
  wave,
  waveId,
  dropId = null,
  children,
}: {
  readonly wave: unknown;
  readonly waveId: string | null | undefined;
  readonly dropId?: string | null | undefined;
  readonly children: ReactNode;
}) {
  const around = useContext(WavesMoveScopeContext);
  const signal = waveMoveSignal(wave);
  let scope: WavesMoveScopeValue;
  if (!waveId) {
    // No wave here (a list, a page before its wave loads): the scope around.
    scope = around;
  } else if (signal !== null) {
    scope = signal ? "moves" : "stays";
  } else {
    scope = around === "none" ? "stays" : around;
  }

  useEffect(() => {
    if (!waveId) {
      return;
    }
    if (signal !== null) {
      rememberWaveMove(waveId, signal);
    }
    if (dropId) {
      rememberDropWave(dropId, waveId);
    }
  }, [waveId, signal, dropId]);

  return (
    <WavesMoveScopeContext.Provider value={scope}>
      {children}
    </WavesMoveScopeContext.Provider>
  );
}
