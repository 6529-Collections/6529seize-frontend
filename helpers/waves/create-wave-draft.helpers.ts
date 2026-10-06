/**
 * On-device persistence for in-progress wave creation. Getting a wave right
 * keeps configuration and first-post text available after a reload or close.
 * Named drafts are scoped to the connected wallet and profile. Older unscoped
 * drafts remain available as settings-only drafts.
 *
 * localStorage (not sessionStorage): the whole point is surviving tab death.
 * Not persisted, by their nature:
 * - pictures, inline images, attachments and uploaded media, and
 * - signatures, signing messages and authentication credentials.
 * A restored draft explains when media needs re-uploading. Drafts clear after
 * the server confirms the wave was created.
 */

import type { CreateWaveConfig } from "@/types/waves.types";
import type { Period } from "@/helpers/Types";
import type { CreateDropConfig } from "@/entities/IDrop";

const STORAGE_KEY = "create-wave-drafts:v1";
const storageKey = (scope?: string): string =>
  scope ? `create-wave-drafts:v2:${scope}` : STORAGE_KEY;

/** Only authoring text and references survive recovery; never credentials or files. */
export const getCreateWaveTextDraft = (
  drop: CreateDropConfig | null
): CreateDropConfig | null => {
  if (!drop) return null;
  return {
    title: drop.title ?? null,
    parts: drop.parts.map((part) => ({
      content: part.content?.replace(/!\[[^\]]*\]\([^)]*\)/g, "") ?? null,
      quoted_drop: part.quoted_drop ?? null,
      media: [],
      mentioned_groups: part.mentioned_groups ?? [],
    })),
    mentioned_users: drop.mentioned_users,
    mentioned_waves: drop.mentioned_waves ?? [],
    referenced_nfts: drop.referenced_nfts,
    metadata: drop.metadata,
    signature: null,
  };
};

export const hasCreateWaveDraftMedia = (
  drop: CreateDropConfig | null
): boolean =>
  !!drop?.parts.some(
    (part) =>
      part.media.length > 0 ||
      (part.attachments?.length ?? 0) > 0 ||
      (part.uploaded_attachments?.length ?? 0) > 0 ||
      /!\[[^\]]*\]\(/.test(part.content ?? "")
  );

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
  readonly description?: CreateDropConfig | null;
  readonly mediaOmitted?: boolean;
  readonly settingsOnly?: boolean;
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
  if (candidate === null || typeof candidate !== "object") {
    return false;
  }
  const draft = candidate as {
    readonly id?: unknown;
    readonly updatedAt?: unknown;
    readonly config?: { readonly overview?: { readonly name?: unknown } };
  };
  return (
    typeof draft.id === "string" &&
    typeof draft.updatedAt === "number" &&
    typeof draft.config?.overview?.name === "string"
  );
};

const readStoredDrafts = (scope?: string): CreateWaveDraft[] => {
  const storage = getLocalStorage();
  if (!storage) {
    return [];
  }
  let serialized: string | null = null;
  try {
    serialized = storage.getItem(storageKey(scope));
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
      .map((draft) => ({
        ...draft,
        config: {
          ...draft.config,
          overview: { ...draft.config.overview, image: null },
        },
        description: scope
          ? getCreateWaveTextDraft(draft.description ?? null)
          : null,
        settingsOnly: !scope,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

export const readCreateWaveDrafts = (scope?: string): CreateWaveDraft[] => {
  const owned = readStoredDrafts(scope);
  if (!scope) return owned;
  const ownedIds = new Set(owned.map((draft) => draft.id));
  return [
    ...owned,
    ...readStoredDrafts().filter((draft) => !ownedIds.has(draft.id)),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
};

// External-store plumbing so components can read drafts via
// useSyncExternalStore instead of an init-in-effect. The snapshot is cached
// (and returned by reference) so a re-render never sees a fresh array unless
// the store actually changed — required, or useSyncExternalStore loops.
const draftsListeners = new Set<() => void>();
const draftsSnapshots = new Map<string, CreateWaveDraft[]>();
// Stable reference for SSR/hydration: the server has no localStorage, so the
// first client render must match this empty snapshot and only populate after.
const EMPTY_DRAFTS: CreateWaveDraft[] = [];

const emitDraftsChanged = (): void => {
  draftsSnapshots.clear();
  for (const listener of draftsListeners) {
    listener();
  }
};

export const subscribeToCreateWaveDrafts = (
  listener: () => void
): (() => void) => {
  draftsListeners.add(listener);
  return () => {
    draftsListeners.delete(listener);
  };
};

export const getCreateWaveDraftsSnapshot = (
  scope?: string
): CreateWaveDraft[] => {
  const key = storageKey(scope);
  const cached = draftsSnapshots.get(key);
  if (cached) return cached;
  const drafts = readCreateWaveDrafts(scope);
  draftsSnapshots.set(key, drafts);
  return drafts;
};

export const getServerCreateWaveDraftsSnapshot = (): CreateWaveDraft[] =>
  EMPTY_DRAFTS;

const writeAll = (drafts: CreateWaveDraft[], scope?: string): void => {
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
    storage.setItem(storageKey(scope), serialized);
  } catch {
    // Quota or serialization failure must never break wave creation.
  }
  // Notify subscribers regardless of the storage write outcome so an in-memory
  // reader stays consistent with what the next read would return.
  emitDraftsChanged();
};

/**
 * Insert or update a draft. The stored config always carries image: null —
 * File objects don't survive serialization, and a broken restore is worse
 * than an honest "re-upload the picture".
 */
export const upsertCreateWaveDraft = (
  draft: CreateWaveDraft,
  scope?: string
): void => {
  const storable: CreateWaveDraft = {
    ...draft,
    description: scope
      ? getCreateWaveTextDraft(draft.description ?? null)
      : null,
    mediaOmitted:
      (draft.mediaOmitted ?? false) ||
      !!draft.config.overview.image ||
      hasCreateWaveDraftMedia(draft.description ?? null),
    settingsOnly: !scope,
    config: {
      ...draft.config,
      overview: { ...draft.config.overview, image: null },
    },
  };
  const others = readStoredDrafts(scope).filter(
    (existing) => existing.id !== draft.id
  );
  writeAll([storable, ...others], scope);
  if (
    scope &&
    readStoredDrafts().some((existing) => existing.id === draft.id)
  ) {
    writeAll(readStoredDrafts().filter((existing) => existing.id !== draft.id));
  }
};

export const deleteCreateWaveDraft = (id: string, scope?: string): void => {
  writeAll(
    readStoredDrafts(scope).filter((draft) => draft.id !== id),
    scope
  );
  if (scope && readStoredDrafts().some((draft) => draft.id === id)) {
    writeAll(readStoredDrafts().filter((draft) => draft.id !== id));
  }
};
