import { useCallback, useEffect, useRef, useState } from "react";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import {
  COMPOSER_ROW_GAP_CLASS_NAME,
  COMPOSER_ROW_PADDING_CLASS_NAME,
} from "@/components/waves/composerPresentation";

export function useE2eeComposerActionTray(
  conversationId: string,
  editing: boolean
) {
  const isMobile = useIsMobileScreen();
  const rowRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const compact = isMobile && !editing;
  const expanded = compact && openFor === conversationId;

  if (editing && openFor !== null) {
    setOpenFor(null);
  }

  const collapse = useCallback(() => setOpenFor(null), []);
  const selectAction = useCallback(() => {
    if (compact) {
      toggleRef.current?.focus({ preventScroll: true });
      collapse();
    }
  }, [compact, collapse]);

  useEffect(() => {
    const row = rowRef.current;
    if (!expanded || !row) return;

    const onOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !row.contains(event.target)) {
        collapse();
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        !row.contains(event.relatedTarget)
      ) {
        collapse();
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        selectAction();
      }
    };

    document.addEventListener("pointerdown", onOutsidePointer, true);
    row.addEventListener("focusout", onFocusOut);
    row.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer, true);
      row.removeEventListener("focusout", onFocusOut);
      row.removeEventListener("keydown", onEscape);
    };
  }, [expanded, collapse, selectAction]);

  return {
    collapse,
    selectAction,
    trayProps: {
      compact,
      expanded,
      toggleRef,
      onToggle: () => setOpenFor(expanded ? null : conversationId),
    },
    rowProps: {
      ref: rowRef,
      className: `tw-relative tw-items-end ${compact ? "tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto]" : "tw-flex"} ${COMPOSER_ROW_GAP_CLASS_NAME} ${COMPOSER_ROW_PADDING_CLASS_NAME}`,
    },
  };
}
