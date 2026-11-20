/** Keep a dialog's focused field visible as its scrollport changes size. */
export function observeFocusedField(
  container: HTMLElement,
  {
    observeContentResize = false,
  }: { readonly observeContentResize?: boolean } = {}
) {
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
        const field = focused.getBoundingClientRect();
        const scrollport = container.getBoundingClientRect();
        const viewport = globalThis.visualViewport;
        let visibleLeft = scrollport.left;
        let visibleRight = scrollport.right;
        let visibleTop = Math.max(scrollport.top, viewport?.offsetTop ?? 0);
        let visibleBottom = Math.min(
          scrollport.bottom,
          viewport
            ? viewport.offsetTop + viewport.height
            : globalThis.innerHeight
        );
        for (
          let parent = focused.parentElement;
          parent && parent !== container;
          parent = parent.parentElement
        ) {
          const style = getComputedStyle(parent);
          const clipsVertically = /^(auto|scroll|hidden|clip)$/.test(
            style.overflowY
          );
          const clipsHorizontally = /^(auto|scroll|hidden|clip)$/.test(
            style.overflowX
          );
          if (!clipsVertically && !clipsHorizontally) continue;
          const clip = parent.getBoundingClientRect();
          if (clipsVertically) {
            visibleTop = Math.max(visibleTop, clip.top);
            visibleBottom = Math.min(visibleBottom, clip.bottom);
          }
          if (clipsHorizontally) {
            visibleLeft = Math.max(visibleLeft, clip.left);
            visibleRight = Math.min(visibleRight, clip.right);
          }
        }
        // Layout often keeps the input visible by itself. Avoid issuing scroll
        // commands on every keyboard frame when there is nothing to reveal.
        if (
          scrollport.height > 0 &&
          field.height > 0 &&
          field.top >= visibleTop &&
          field.bottom <= visibleBottom &&
          field.left >= visibleLeft &&
          field.right <= visibleRight
        )
          return;
        focused.scrollIntoView({
          behavior: "instant",
          block: "nearest",
          inline: "nearest",
        });
      }
    });
  };
  const observer = new ResizeObserver(reveal);
  observer.observe(container);
  // Android can finish its keyboard resize before the reply expansion ends.
  // Follow the content too so the last frame reveals the entire focused field.
  if (observeContentResize) {
    for (const child of container.children) observer.observe(child);
  }
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
