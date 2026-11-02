import { useCallback } from "react";

export function useCompactMenuFocus(autoFocusItem = true) {
  // The portal can mount before the parent reports it open. Check the mounted
  // panel's state when focusing instead of capturing the parent's open value.
  const menuItemsRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!autoFocusItem || !container) return;
      requestAnimationFrame(() => {
        if (!container.isConnected || container.dataset["open"] === undefined) {
          return;
        }
        const selectors = [
          '[data-compact-menu-item="true"][data-active="true"]:not([data-disabled="true"])',
          '[data-compact-menu-item="true"]:not([data-disabled="true"])',
        ];
        for (const selector of selectors) {
          const target = container.querySelector<HTMLButtonElement>(selector);
          if (!target) continue;
          target.focus({ preventScroll: true });
          break;
        }
      });
    },
    [autoFocusItem]
  );
  return { menuItemsRef };
}
