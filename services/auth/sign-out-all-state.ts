/**
 * Sign-out-all runs, readable synchronously anywhere. The provider's
 * `isSigningOutAll` state reaches components a render later, so a sign-out
 * that starts and ends between two renders would be invisible there.
 * Runs are counted, so one that outlives a remounted provider cannot mark
 * another, still active run as finished.
 */
let started = 0;
let active = 0;

export function noteSignOutAllStarted(): void {
  started += 1;
  active += 1;
}

export function noteSignOutAllFinished(): void {
  active = Math.max(0, active - 1);
}

/** How many sign-out-all runs have started, and whether one is running. */
export const getSignOutAllState = (): {
  readonly started: number;
  readonly running: boolean;
} => ({ started, running: active > 0 });
