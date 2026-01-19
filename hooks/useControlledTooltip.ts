import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";

export function useControlledTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  return {
    isOpen,
    setIsOpen,
    triggerProps: {
      tabIndex: 0,
      onMouseEnter: open,
      onMouseLeave: close,
      onFocus: open,
      onBlur: close,
      onKeyDown: handleKeyDown,
    },
  };
}
