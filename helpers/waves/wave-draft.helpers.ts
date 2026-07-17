/**
 * Persist an in-progress wave chat message across a full page reload (e.g.
 * the new-version toast's forced reload) so the user doesn't lose what they
 * were typing.
 *
 * The composer is a Lexical editor; its serialized EditorState JSON captures
 * text, mentions and emoji. It is stored in sessionStorage (per tab, cleared
 * when the tab closes — the right lifetime for a transient draft), keyed by
 * wave. Restoration is done at editor-creation time via
 * initialConfig.editorState (Lexical reads it once), so this module only
 * deals in the serialized JSON string; the composer owns the Lexical objects.
 *
 * Media is intentionally NOT persisted: uploaded files live outside the
 * editor state, and inline image nodes reference blob/object URLs that die on
 * reload — restoring them would show broken images, so a draft containing an
 * image node is skipped entirely (matching today's behavior for that case).
 */

const STORAGE_PREFIX = "wave-draft:v1:";

// A generous ceiling; a genuine chat draft is tiny. Guards against a
// pathological serialized state filling sessionStorage.
const MAX_DRAFT_BYTES = 64 * 1024;

export const getWaveDraftStorageKey = (waveId: string): string =>
  `${STORAGE_PREFIX}${waveId}`;

type LexicalNodeJson = {
  readonly type?: unknown;
  readonly text?: unknown;
  readonly children?: unknown;
};

const getSessionStorage = (): Storage | null => {
  try {
    return (globalThis as typeof globalThis & { sessionStorage?: Storage })
      .sessionStorage ?? null;
  } catch {
    // Accessing sessionStorage can throw in some privacy modes.
    return null;
  }
};

const walkNodes = (
  node: LexicalNodeJson,
  visit: (node: LexicalNodeJson) => void
): void => {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === "object") {
        walkNodes(child as LexicalNodeJson, visit);
      }
    }
  }
};

/**
 * True when a serialized editor state is worth persisting/restoring: it
 * parses, carries non-whitespace text, and contains no image node.
 */
export const isRestorableDraftJson = (serialized: string | null): boolean => {
  if (!serialized || serialized.length > MAX_DRAFT_BYTES) {
    return false;
  }
  let parsed: { readonly root?: LexicalNodeJson };
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return false;
  }
  const root = parsed?.root;
  if (!root || typeof root !== "object") {
    return false;
  }
  let text = "";
  let hasImage = false;
  walkNodes(root, (node) => {
    if (node.type === "image") {
      hasImage = true;
    }
    if (typeof node.text === "string") {
      text += node.text;
    }
  });
  return !hasImage && text.trim().length > 0;
};

/** Store the draft, or clear it when there is nothing worth keeping. */
export const writeWaveDraft = (waveId: string, serialized: string): void => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const key = getWaveDraftStorageKey(waveId);
  try {
    if (isRestorableDraftJson(serialized)) {
      storage.setItem(key, serialized);
    } else {
      storage.removeItem(key);
    }
  } catch {
    // Quota or serialization failure must never break composing.
  }
};

export const clearWaveDraft = (waveId: string): void => {
  const storage = getSessionStorage();
  try {
    storage?.removeItem(getWaveDraftStorageKey(waveId));
  } catch {
    /* ignore */
  }
};

/**
 * The serialized editor state to seed a fresh composer with, or null when
 * there is no restorable draft. Safe to call at render time.
 */
export const readRestorableWaveDraft = (waveId: string): string | null => {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }
  let serialized: string | null = null;
  try {
    serialized = storage.getItem(getWaveDraftStorageKey(waveId));
  } catch {
    return null;
  }
  return isRestorableDraftJson(serialized) ? serialized : null;
};
