/**
 * Sign-out-all runs, readable synchronously anywhere. The provider's
 * `isSigningOutAll` state reaches components a render later, so a sign-out
 * that starts and ends between two renders would be invisible there.
 */
let started = 0;
let running = false;

export function noteSignOutAllStarted(): void {
  started += 1;
  running = true;
}

export function noteSignOutAllFinished(): void {
  running = false;
}

/** How many sign-out-all runs have started, and whether one is running. */
export const getSignOutAllState = (): {
  readonly started: number;
  readonly running: boolean;
} => ({ started, running });
