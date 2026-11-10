/** How long copied text stays on the clipboard. */
const CLIPBOARD_TTL_MS = 30_000;

/**
 * Empties the clipboard if it still holds `copied`. Reading the clipboard
 * is not allowed everywhere; then the text stays, as it would have anyway.
 */
async function clearClipboardIfUnchanged(copied: string): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard as Clipboard | undefined;
  if (!clipboard?.readText || !clipboard.writeText) {
    return;
  }
  try {
    if ((await clipboard.readText()) === copied) {
      await clipboard.writeText("");
    }
  } catch {
    // Clipboard read and write permissions vary by platform; best effort.
  }
}

/**
 * Clears copied text from the clipboard after a short delay, unless
 * something else was copied since. The timer outlives the dialog that
 * copied it: that is when it matters.
 */
export function clearClipboardLater(
  copied: string,
  delayMs = CLIPBOARD_TTL_MS
): void {
  setTimeout(() => {
    void clearClipboardIfUnchanged(copied);
  }, delayMs);
}
