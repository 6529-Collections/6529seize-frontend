/**
 * Which waves move to the 6529 Network. Members-only waves, waves behind a
 * hidden or private group, and their decisions stay on 6529.io; the rest
 * move. 6529.io's API says which per wave; a wave whose objects don't say is
 * treated as staying, so nothing pauses or announces a move it may not make.
 */

/** The field 6529.io's API marks a staying wave with. */
const WAVE_STAYS_FIELD = "stays_on_site";

/**
 * The API's word on a wave or a drop's wave: true when it moves, false when
 * it stays, null when the object doesn't say (an API from before the
 * field). 6529.io's API names the ones that stay: `stays_on_site`, on
 * waves, drops' waves and decisions.
 */
export function waveMoveSignal(wave: unknown): boolean | null {
  if (typeof wave !== "object" || wave === null) {
    return null;
  }
  const stays = (wave as Record<string, unknown>)[WAVE_STAYS_FIELD];
  return typeof stays === "boolean" ? !stays : null;
}

/**
 * `target` with `source`'s stays_on_site, when it has one: for a wave
 * object the site builds from another (the generated models don't carry the
 * field yet).
 */
export function withStaysOnSite<T extends object>(
  target: T,
  source: unknown
): T {
  const stays =
    typeof source === "object" && source !== null
      ? (source as Record<string, unknown>)[WAVE_STAYS_FIELD]
      : undefined;
  return typeof stays === "boolean"
    ? { ...target, [WAVE_STAYS_FIELD]: stays }
    : target;
}

// What the pages have read, for the request guard, which sees only paths
// and bodies: wave id to whether it moves, and drop id to its wave.
const waveMoves = new Map<string, boolean>();
const dropWaves = new Map<string, string>();

/** Remembers what a page read about a wave. */
export function rememberWaveMove(waveId: string, moves: boolean): void {
  waveMoves.set(waveId, moves);
}

/** Remembers the wave a page showed a drop in. */
export function rememberDropWave(dropId: string, waveId: string): void {
  dropWaves.set(dropId, waveId);
}

/** True only for a wave a page has read as moving. */
export function isKnownMovingWave(waveId: string | null | undefined): boolean {
  return !!waveId && waveMoves.get(waveId) === true;
}

/** The wave a page showed a drop in, when it did. */
export function waveOfKnownDrop(dropId: string): string | null {
  return dropWaves.get(dropId) ?? null;
}

/** For tests: forgets what pages read. */
export function forgetWaveMoves(): void {
  waveMoves.clear();
  dropWaves.clear();
}
