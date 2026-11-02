/** Keep a dialog's focused field visible as its scrollport changes size. */
export function observeFocusedField(container: HTMLElement) {
  let focusFrame: number | undefined;
  const reveal = () => {
    if (focusFrame !== undefined) globalThis.cancelAnimationFrame(focusFrame);
    // Follow layout frames instead of waiting for the keyboard to finish.
    focusFrame = globalThis.requestAnimationFrame(() => {
      focusFrame = undefined;
      const focused = document.activeElement;
      if (
        focused instanceof HTMLElement &&
        container.contains(focused) &&
        (focused instanceof HTMLInputElement ||
          focused instanceof HTMLTextAreaElement ||
          focused.isContentEditable)
      ) {
        focused.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
  };
  const observer = new ResizeObserver(reveal);
  observer.observe(container);
  container.addEventListener("focusin", reveal);
  return {
    reveal,
    disconnect: () => {
      observer.disconnect();
      if (focusFrame !== undefined) globalThis.cancelAnimationFrame(focusFrame);
      container.removeEventListener("focusin", reveal);
    },
  };
}
