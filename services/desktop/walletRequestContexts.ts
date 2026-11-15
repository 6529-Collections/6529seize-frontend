import { isDesktopShell } from "@/helpers/desktop-shell";

/**
 * 6529 Desktop wallet forwarding: the content behind a drop or decision
 * signature, kept for the moment between building the message and the
 * wallet connector forwarding it, so the browser page can show it (after
 * recomputing its hash). Keyed by the exact message text; each entry is
 * taken once. Kept only inside 6529 Desktop, at most a few, briefly.
 */

const MAX_ENTRIES = 4;
const TTL_MS = 10 * 60 * 1000;

const contexts = new Map<
  string,
  { readonly context: string; readonly at: number }
>();

/**
 * Remembers the context for `message`. `build` runs only inside 6529
 * Desktop, so the web never builds or keeps one.
 */
export function rememberWalletRequestContext(
  message: string,
  build: () => string
): void {
  if (!isDesktopShell()) return;
  let context: string;
  try {
    context = build();
  } catch {
    // Without context the browser page shows the fingerprint instead.
    return;
  }
  contexts.delete(message);
  contexts.set(message, { context, at: Date.now() });
  while (contexts.size > MAX_ENTRIES) {
    const oldest = contexts.keys().next().value;
    if (oldest === undefined) break;
    contexts.delete(oldest);
  }
}

/** Takes the context remembered for exactly this message, if still fresh. */
export function takeWalletRequestContext(message: string): string | undefined {
  const entry = contexts.get(message);
  contexts.delete(message);
  if (!entry || Date.now() - entry.at > TTL_MS) return undefined;
  return entry.context;
}

/** @api Resets the module state between tests. */
export function __resetWalletRequestContextsForTests(): void {
  contexts.clear();
}
