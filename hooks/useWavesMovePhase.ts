"use client";

import { useSyncExternalStore } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getNextWavesMoveChangeMs,
  getWavesMovePhase,
  getWavesMoveSchedule,
  isWavesWritePausedPhase,
  type WavesMovePhase,
} from "@/lib/waves-move/schedule";

// setTimeout fires at once for delays above 2^31 - 1 ms (about 24.8 days).
const MAX_TIMER_DELAY_MS = 2_147_483_647;

const getPhaseNow = (): WavesMovePhase =>
  getWavesMovePhase(Date.now(), getWavesMoveSchedule());

// Every control on a page follows the same two instants, so they share one
// timer instead of one each.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

const armTimer = () => {
  const now = Date.now();
  const next = getNextWavesMoveChangeMs(now, getWavesMoveSchedule());
  if (next === null) {
    return;
  }
  timer = setTimeout(
    () => {
      timer = undefined;
      for (const listener of [...listeners]) {
        listener();
      }
      if (listeners.size > 0) {
        armTimer();
      }
    },
    Math.min(Math.max(next - now, 0) + 1, MAX_TIMER_DELAY_MS)
  );
};

// A suspended tab or app runs no timers; reread the phase when it returns.
const onVisible = () => {
  if (document.visibilityState !== "visible") {
    return;
  }
  for (const listener of [...listeners]) {
    listener();
  }
};

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisible);
  }
  if (timer === undefined) {
    armTimer();
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) {
      return;
    }
    document.removeEventListener("visibilitychange", onVisible);
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
};

// The server and the first client render show no phase, so the markup they
// make always matches; the clock's phase follows right after hydration.
const getServerPhase = (): WavesMovePhase => "none";

/**
 * The phase of the move to the 6529 Network (lib/waves-move/schedule.ts),
 * updated when the freeze and the switch-on pass while the page is open.
 */
export function useWavesMovePhase(): WavesMovePhase {
  return useSyncExternalStore(subscribe, getPhaseNow, getServerPhase);
}

/**
 * Whether 6529.io's own vote, entry, poll, wave REP, wave and decision
 * writes are closed, following the clock.
 */
export function useWavesWritesPaused(): boolean {
  return isWavesWritePausedPhase(useWavesMovePhase());
}

/**
 * "Paused for the move to the 6529 Network." while those writes are closed,
 * in the viewer's locale; null otherwise.
 */
export function useWavesPausedReason(): string | null {
  const locale = useBrowserLocale();
  return useWavesWritesPaused() ? t(locale, "wavesMove.paused") : null;
}
