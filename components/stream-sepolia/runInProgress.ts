/**
 * Whether a creation run on this page has started and not finished. Switching
 * the test instance reloads the page and would drop the run's progress and any
 * signatures it holds, so the switch asks first while one is active.
 */
let activeRuns = 0;

/** Marks a run as active; call the returned function when it ends or unmounts. */
export function markRunActive(): () => void {
  activeRuns += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeRuns -= 1;
  };
}

export function isRunActive(): boolean {
  return activeRuns > 0;
}
