/**
 * Remember which subwave (and its parent) the user is viewing so the sidebar
 * wave tree can expand and highlight it immediately after a full reload —
 * e.g. the new-version toast's forced reload.
 *
 * On live SPA navigation the parent is known instantly (cached), so the tree
 * expands with no flicker. On a cold load the sidebar must wait for a fetch
 * waterfall (active wave -> its parent_wave -> the parent's subwaves) before
 * it can expand, leaving the subwave collapsed for a beat. Persisting the
 * active subwave's parent lets the tree use it as an immediate fallback and
 * skip that wait. sessionStorage (per tab, cleared on close) is the right
 * lifetime — this is a transient view hint, not a saved preference.
 *
 * The hint is keyed to the active wave id so it can only ever apply to the
 * wave actually being viewed: a stale hint from a previously-viewed subwave
 * never expands the wrong parent.
 */

const STORAGE_KEY = "sidebar-active-subwave-parent:v1";

interface ActiveSubwaveParentHint {
  readonly waveId: string;
  readonly parentWaveId: string;
}

const getSessionStorage = (): Storage | null => {
  try {
    return (globalThis as typeof globalThis & { sessionStorage?: Storage })
      .sessionStorage ?? null;
  } catch {
    return null;
  }
};

export const readActiveSubwaveParentHint =
  (): ActiveSubwaveParentHint | null => {
    const storage = getSessionStorage();
    if (!storage) {
      return null;
    }
    let raw: string | null = null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ActiveSubwaveParentHint>;
      if (
        typeof parsed.waveId === "string" &&
        typeof parsed.parentWaveId === "string"
      ) {
        return { waveId: parsed.waveId, parentWaveId: parsed.parentWaveId };
      }
    } catch {
      /* fall through */
    }
    return null;
  };

export const writeActiveSubwaveParentHint = (
  hint: ActiveSubwaveParentHint
): void => {
  const storage = getSessionStorage();
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(hint));
  } catch {
    /* non-critical */
  }
};

/**
 * The parent wave id to treat as the active subwave's parent: the live value
 * when known, otherwise the persisted hint — but only when that hint belongs
 * to the wave currently being viewed.
 */
export const resolveActiveSubwaveParent = (
  activeWaveId: string | null,
  liveParentWaveId: string | null,
  hint: ActiveSubwaveParentHint | null
): string | null => {
  if (liveParentWaveId) {
    return liveParentWaveId;
  }
  if (hint && activeWaveId !== null && hint.waveId === activeWaveId) {
    return hint.parentWaveId;
  }
  return null;
};
