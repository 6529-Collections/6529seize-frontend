/** How long copied text stays on the clipboard. */
const CLIPBOARD_TTL_MS = 30_000;

/**
 * Empties the clipboard if it still holds `copied`. Reading the clipboard
 * is not allowed everywhere; then the text stays, as it would have anyway.
 */
async function clearClipboardIfUnchanged(copied: string): Promise<void> {
  try {
    // Throws where the clipboard or reading it is not available.
    if ((await navigator.clipboard.readText()) === copied) {
      await navigator.clipboard.writeText("");
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
