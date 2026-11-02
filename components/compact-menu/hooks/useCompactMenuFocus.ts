import { useCallback } from "react";

export function useCompactMenuFocus(open: boolean, autoFocusItem = true) {
  // The anchored panel mounts in a portal after the menu's opening render.
  const menuItemsRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!open || !autoFocusItem || !container) return;
      const selectors = [
        '[data-compact-menu-item="true"][data-active="true"]:not([data-disabled="true"])',
        '[data-compact-menu-item="true"]:not([data-disabled="true"])',
      ];
      for (const selector of selectors) {
        const target = container.querySelector<HTMLButtonElement>(selector);
        if (!target) continue;
        requestAnimationFrame(() => {
          if (target.isConnected && container.dataset["open"] !== undefined) {
            target.focus({ preventScroll: true });
          }
        });
        break;
      }
    },
    [open, autoFocusItem]
  );
  return { menuItemsRef };
}
