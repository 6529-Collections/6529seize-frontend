import { publicEnv } from "@/config/env";

/**
 * Votes, entries, polls, wave REP, and wave and decision settings
 * move from 6529.io's database to the 6529 Network. 6529.io stops taking
 * these changes at the freeze, and the network opens them at the switch-on.
 * Chat keeps working throughout.
 *
 * `NEXT_PUBLIC_WAVES_FREEZE_AT` and `NEXT_PUBLIC_WAVES_SWITCH_ON_AT` name the
 * two instants in UTC, for example `2026-11-25T00:00:00Z` and
 * `2026-11-26T00:00:00Z`. Both must be set, and the switch-on must come after
 * the freeze; otherwise nothing changes.
 *
 * - `notice`: before the freeze. Everything works; the notice says what is
 *   coming.
 * - `frozen`: between the freeze and the switch-on. These writes are paused.
 * - `moved`: from the switch-on. 6529.io's own routes for these writes stay
 *   closed; each one opens again here as it moves to signed operations on the
 *   6529 Network.
 */
export type WavesMovePhase = "none" | "notice" | "frozen" | "moved";

export interface WavesMoveSchedule {
  readonly freezeAtMs: number;
  readonly switchOnMs: number;
}

const DATE_TIME_PREFIX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function parseWavesMoveInstant(
  raw: string | null | undefined
): number | null {
  const value = raw?.trim();
  // A UTC instant only: an offset or a local time would move the freeze.
  if (!value?.endsWith("Z") || !DATE_TIME_PREFIX.test(value)) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function getWavesMoveSchedule(): WavesMoveSchedule | null {
  const freezeAtMs = parseWavesMoveInstant(
    publicEnv.NEXT_PUBLIC_WAVES_FREEZE_AT
  );
  const switchOnMs = parseWavesMoveInstant(
    publicEnv.NEXT_PUBLIC_WAVES_SWITCH_ON_AT
  );
  if (freezeAtMs === null || switchOnMs === null || switchOnMs <= freezeAtMs) {
    return null;
  }
  return { freezeAtMs, switchOnMs };
}

export function getWavesMovePhase(
  nowMs: number,
  schedule: WavesMoveSchedule | null
): WavesMovePhase {
  if (schedule === null) {
    return "none";
  }
  if (nowMs < schedule.freezeAtMs) {
    return "notice";
  }
  if (nowMs < schedule.switchOnMs) {
    return "frozen";
  }
  return "moved";
}

/** The next instant the phase changes, or null when it no longer changes. */
export function getNextWavesMoveChangeMs(
  nowMs: number,
  schedule: WavesMoveSchedule | null
): number | null {
  if (schedule === null) {
    return null;
  }
  if (nowMs < schedule.freezeAtMs) {
    return schedule.freezeAtMs;
  }
  return nowMs < schedule.switchOnMs ? schedule.switchOnMs : null;
}

export function isWavesWritePausedPhase(phase: WavesMovePhase): boolean {
  return phase === "frozen" || phase === "moved";
}

/**
 * Whether 6529.io's own vote, entry, poll, wave REP, wave and decision
 * writes are closed now. Components that must follow the clock across the
 * freeze use `useWavesWritesPaused` instead.
 */
export function isWavesWritePaused(nowMs: number = Date.now()): boolean {
  return isWavesWritePausedPhase(
    getWavesMovePhase(nowMs, getWavesMoveSchedule())
  );
}
