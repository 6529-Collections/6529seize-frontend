import type { Page } from "@playwright/test";

/** Measure cached text visible on a browser frame from the actual Chat click. */
export async function observeCachedChatResponse(page: Page) {
  const observation = await page.evaluateHandle(() => {
    let started: number | null = null;
    let elapsed: number | null = null;
    let frame = 0;
    let domVisible: number | null = null;
    const hasVisibleContent = () => {
      const regions = document.querySelectorAll(
        '[aria-label="Wave chat file upload area"]'
      );
      let visible = false;
      for (const region of regions) {
        const text = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
        while (text.nextNode()) {
          const element = text.currentNode.parentElement;
          if (
            text.currentNode.textContent?.includes("6529-composer-preview") &&
            element?.checkVisibility({
              visibilityProperty: true,
              opacityProperty: true,
            }) &&
            !element.closest('[inert], [aria-hidden="true"]')
          ) {
            visible = true;
            break;
          }
        }
        if (visible) break;
      }
      return visible;
    };
    const mutations = new MutationObserver(() => {
      if (started !== null && domVisible === null && hasVisibleContent()) {
        domVisible = performance.now() - started;
      }
    });
    const sample = () => {
      if (hasVisibleContent() && started !== null) {
        elapsed = performance.now() - started;
        mutations.disconnect();
      } else frame = requestAnimationFrame(sample);
    };
    const onClick = (event: MouseEvent) => {
      const control =
        event.target instanceof Element
          ? event.target.closest('[role="tab"], button')
          : null;
      if (control?.textContent?.trim() !== "Chat") return;
      started = performance.now();
      mutations.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "inert", "aria-hidden"],
      });
      document.removeEventListener("click", onClick, true);
      frame = requestAnimationFrame(sample);
    };
    document.addEventListener("click", onClick, true);
    return {
      read: () => elapsed,
      details: () => ({ domVisibleMs: domVisible, frameVisibleMs: elapsed }),
      dispose: () => {
        mutations.disconnect();
        cancelAnimationFrame(frame);
        document.removeEventListener("click", onClick, true);
      },
    };
  });
  return {
    read: () => observation.evaluate((state) => state.read()),
    details: () => observation.evaluate((state) => state.details()),
    dispose: async () => {
      await observation.evaluate((state) => state.dispose());
      await observation.dispose();
    },
  };
}
