/**
 * On-device persistence for in-progress wave creation. Getting a wave right
 * takes many steps — especially on a phone — and all of it used to vanish if
 * the tab died, the modal closed or the submit failed. Once a flow makes it
 * past the Overview step, its full config is autosaved here and offered for
 * resume on the Overview step.
 *
 * localStorage (not sessionStorage): the whole point is surviving tab death.
 * Not persisted, by their nature:
 * - the wave picture (a File object; blob URLs die with the tab), and
 * - the Description step's rich-text drop (owned by the embedded Lexical
 *   composer, which has no external seed path in the page flow today).
 * A restored draft carries everything else; drafts are cleared only after
 * the server confirms the wave was created.
 */

import type { CreateWaveConfig } from "@/types/waves.types";
import type { Period } from "@/helpers/Types";

const STORAGE_KEY = "create-wave-drafts:v1";

// Drafts are a few KB each; the caps guard against pathological growth, not
// real use. Oldest drafts are evicted first. The size cap counts UTF-16
// code units (string length), not bytes — a coarse bound, which is all it
// needs to be next to the hard 8-draft cap.
const MAX_DRAFTS = 8;
const MAX_TOTAL_CHARS = 512 * 1024;

export interface CreateWaveDraftEndDateConfig {
  readonly time: number | null;
  readonly period: Period | null;
}

export interface CreateWaveDraft {
  readonly id: string;
  readonly updatedAt: number;
  readonly config: CreateWaveConfig;
  readonly endDateConfig: CreateWaveDraftEndDateConfig;
}

const getLocalStorage = (): Storage | null => {
  try {
    return (
      (globalThis as typeof globalThis & { localStorage?: Storage })
        .localStorage ?? null
    );
  } catch {
    // Accessing localStorage can throw in some privacy modes.
    return null;
  }
};

const isDraftShaped = (candidate: unknown): candidate is CreateWaveDraft => {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }
  const draft = candidate as Partial<CreateWaveDraft>;
  return (
    typeof draft.id === "string" &&
    typeof draft.updatedAt === "number" &&
    !!draft.config &&
    typeof draft.config === "object" &&
    typeof draft.config.overview?.name === "string"
  );
};

export const readCreateWaveDrafts = (): CreateWaveDraft[] => {
  const storage = getLocalStorage();
  if (!storage) {
    return [];
  }
  let serialized: string | null = null;
  try {
    serialized = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!serialized) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(isDraftShaped)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

const writeAll = (drafts: CreateWaveDraft[]): void => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  let retained = [...drafts]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_DRAFTS);
  try {
    let serialized = JSON.stringify(retained);
    while (serialized.length > MAX_TOTAL_CHARS && retained.length > 1) {
      retained = retained.slice(0, retained.length - 1);
      serialized = JSON.stringify(retained);
    }
    storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Quota or serialization failure must never break wave creation.
  }
};

/**
 * Insert or update a draft. The stored config always carries image: null —
 * File objects don't survive serialization, and a broken restore is worse
 * than an honest "re-upload the picture".
 */
export const upsertCreateWaveDraft = (draft: CreateWaveDraft): void => {
  const storable: CreateWaveDraft = {
    ...draft,
    config: {
      ...draft.config,
      overview: { ...draft.config.overview, image: null },
    },
  };
  const others = readCreateWaveDrafts().filter(
    (existing) => existing.id !== draft.id
  );
  writeAll([storable, ...others]);
};

export const deleteCreateWaveDraft = (id: string): void => {
  writeAll(readCreateWaveDrafts().filter((draft) => draft.id !== id));
};
