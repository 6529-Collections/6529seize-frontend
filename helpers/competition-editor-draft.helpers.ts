import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";

export type SavedCompetitionDraft = Pick<
  ApiCompetition,
  "id" | "config_version"
>;
export interface CompetitionEditorDraft {
  input: ApiCompetitionDraftInput;
  competition: SavedCompetitionDraft | null;
  savedFingerprint: string;
  pending: { fingerprint: string; key: string } | null;
}

function isEditorDraft(
  candidate: unknown
): candidate is CompetitionEditorDraft {
  if (candidate === null || typeof candidate !== "object") return false;
  const value = candidate as {
    input?: {
      title?: unknown;
      participation?: { scope?: unknown };
      voting?: { scope?: unknown };
      rules?: unknown;
      presentation?: unknown;
      outcomes?: unknown;
    };
    savedFingerprint?: unknown;
  };
  return (
    typeof value.input?.title === "string" &&
    Boolean(value.input.participation?.scope) &&
    Boolean(value.input.voting?.scope) &&
    Boolean(value.input.rules) &&
    Array.isArray(value.input.presentation) &&
    Array.isArray(value.input.outcomes) &&
    typeof value.savedFingerprint === "string"
  );
}

export function readCompetitionEditorDraft(
  key: string,
  existingCompetition = false
): CompetitionEditorDraft | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!isEditorDraft(value)) return null;
    if (
      existingCompetition &&
      !value.pending &&
      JSON.stringify(value.input) === value.savedFingerprint
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

/** Tracks successful local writes independently of React's render state. */
export function createCompetitionDraftStorage(storageKey: string) {
  let fingerprint: string | null = null;
  const listeners = new Set<() => void>();
  const keys = (competition: SavedCompetitionDraft | null) =>
    competition
      ? [storageKey, storageKey.replace(/:[^:]+$/, `:${competition.id}`)]
      : [storageKey];
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => fingerprint,
    getServerSnapshot: () => null,
    write(value: CompetitionEditorDraft): boolean {
      try {
        for (const key of keys(value.competition))
          localStorage.setItem(key, JSON.stringify(value));
        fingerprint = JSON.stringify(value.input);
      } catch {
        fingerprint = null;
      }
      listeners.forEach((listener) => listener());
      return fingerprint !== null;
    },
    clear(competition: SavedCompetitionDraft | null) {
      try {
        for (const key of keys(competition)) localStorage.removeItem(key);
      } catch {
        // Storage is unavailable; the server copy is already saved.
      }
      fingerprint = null;
      listeners.forEach((listener) => listener());
    },
  };
}
