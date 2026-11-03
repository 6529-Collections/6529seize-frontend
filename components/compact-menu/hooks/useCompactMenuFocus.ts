import { useCallback, useEffect, useRef } from "react";

export function useCompactMenuFocus(open: boolean, autoFocusItem = true) {
  const menuItemsRef = useRef<HTMLDivElement | null>(null);

  const focusInitialMenuItem = useCallback(() => {
    const container = menuItemsRef.current;
    if (!autoFocusItem || !container) {
      return;
    }

    const selectors = [
      '[data-compact-menu-item="true"][data-active="true"]:not([data-disabled="true"])',
      '[data-compact-menu-item="true"]:not([data-disabled="true"])',
    ];

    for (const selector of selectors) {
      const target = container.querySelector<HTMLButtonElement>(selector);
      if (!target) {
        continue;
      }
      requestAnimationFrame(() => {
        if (!target.isConnected) {
          return;
        }
        target.focus();
      });
      break;
    }
  }, [autoFocusItem]);

  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      focusInitialMenuItem();
    }
    wasOpenRef.current = open;
  }, [open, focusInitialMenuItem]);

  return { menuItemsRef, focusInitialMenuItem };
}
