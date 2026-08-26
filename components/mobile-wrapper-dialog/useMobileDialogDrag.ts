import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HTMLAttributes, TouchEvent } from "react";

const DISMISS_DRAG_DISTANCE_PX = 44;
const DISMISS_DRAG_FLICK_DISTANCE_PX = 18;
const DISMISS_DRAG_FLICK_VELOCITY_PX_MS = 0.42;
const DISMISS_DRAG_SETTLE_MS = 150;
const DRAG_START_REGION_PX = 112;
const MAX_DRAG_OFFSET_PX = 260;
const TABLET_MODAL_DESKTOP_QUERY = "(min-width: 768px)";

type DragTouchHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel"
>;

type MobileDialogDragOptions = {
  readonly dismissible: boolean;
  readonly showDragHandle?: boolean | undefined;
  readonly enableDragToClose?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
  readonly onClose: () => void;
  readonly onAfterLeave?: (() => void) | undefined;
};

function getDragTouchHandlers({
  canDragToClose,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  resetDrag,
}: {
  readonly canDragToClose: boolean;
  readonly handleDragStart: (event: TouchEvent<HTMLDivElement>) => void;
  readonly handleDragMove: (event: TouchEvent<HTMLDivElement>) => void;
  readonly handleDragEnd: () => void;
  readonly resetDrag: () => void;
}): DragTouchHandlers {
  if (!canDragToClose) {
    return { onTouchCancel: resetDrag };
  }

  return {
    onTouchStart: handleDragStart,
    onTouchMove: handleDragMove,
    onTouchEnd: handleDragEnd,
    onTouchCancel: resetDrag,
  };
}

function startsInDragRegion(event: TouchEvent<HTMLDivElement>): boolean {
  const touch = event.touches[0];
  if (!touch) {
    return false;
  }

  return (
    touch.clientY - event.currentTarget.getBoundingClientRect().top <=
    DRAG_START_REGION_PX
  );
}

function shouldDismissDrag(releasedOffset: number, startedAt: number): boolean {
  const elapsed = Math.max(performance.now() - startedAt, 1);
  const velocity = releasedOffset / elapsed;

  return (
    releasedOffset >= DISMISS_DRAG_DISTANCE_PX ||
    (releasedOffset >= DISMISS_DRAG_FLICK_DISTANCE_PX &&
      velocity >= DISMISS_DRAG_FLICK_VELOCITY_PX_MS)
  );
}

function isCenteredTabletModal(tabletModal?: boolean): boolean {
  return (
    !!tabletModal &&
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(TABLET_MODAL_DESKTOP_QUERY).matches
  );
}

function getDismissDragOffset(): number {
  return Math.max(
    globalThis.visualViewport?.height ?? 0,
    globalThis.innerHeight ?? 0,
    MAX_DRAG_OFFSET_PX
  );
}

export function useMobileDialogDrag({
  dismissible,
  showDragHandle,
  enableDragToClose,
  tabletModal,
  onClose,
  onAfterLeave,
}: MobileDialogDragOptions) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartedAtRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (dismissible) {
      onClose();
    }
  }, [dismissible, onClose]);

  const canDragToClose = dismissible && (enableDragToClose ?? !!showDragHandle);

  const cancelScheduledDragFrame = useCallback(() => {
    if (dragFrameRef.current === null) {
      return;
    }

    if (typeof globalThis.cancelAnimationFrame === "function") {
      globalThis.cancelAnimationFrame(dragFrameRef.current);
    }

    dragFrameRef.current = null;
  }, []);

  const cancelScheduledDismiss = useCallback(() => {
    if (dismissTimerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const scheduleDragOffsetUpdate = useCallback(() => {
    if (typeof globalThis.requestAnimationFrame !== "function") {
      setDragOffset(dragOffsetRef.current);
      return;
    }

    if (dragFrameRef.current !== null) {
      return;
    }

    dragFrameRef.current = globalThis.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      setDragOffset(dragOffsetRef.current);
    });
  }, []);

  const setClampedDragOffset = useCallback(
    (offset: number) => {
      const clampedOffset = Math.min(Math.max(offset, 0), MAX_DRAG_OFFSET_PX);
      if (dragOffsetRef.current === clampedOffset) {
        return;
      }

      dragOffsetRef.current = clampedOffset;
      scheduleDragOffsetUpdate();
    },
    [scheduleDragOffsetUpdate]
  );

  const resetDrag = useCallback(() => {
    cancelScheduledDragFrame();
    cancelScheduledDismiss();
    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, [cancelScheduledDismiss, cancelScheduledDragFrame]);

  useEffect(
    () => () => {
      cancelScheduledDragFrame();
      cancelScheduledDismiss();
    },
    [cancelScheduledDismiss, cancelScheduledDragFrame]
  );

  const handleDragStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (
        !touch ||
        !canDragToClose ||
        isCenteredTabletModal(tabletModal) ||
        !startsInDragRegion(event)
      ) {
        return;
      }

      dragStartYRef.current = touch.clientY;
      dragStartedAtRef.current = performance.now();
      setIsDragging(true);
      setClampedDragOffset(0);
    },
    [canDragToClose, setClampedDragOffset, tabletModal]
  );

  const handleDragMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch || !canDragToClose || dragStartYRef.current === null) {
        return;
      }

      const nextOffset = touch.clientY - dragStartYRef.current;
      if (nextOffset <= 0) {
        setClampedDragOffset(0);
        return;
      }

      event.preventDefault();
      setClampedDragOffset(nextOffset);
    },
    [canDragToClose, setClampedDragOffset]
  );

  const handleDragEnd = useCallback(() => {
    if (!canDragToClose || dragStartYRef.current === null) {
      resetDrag();
      return;
    }

    const releasedOffset = dragOffsetRef.current;
    const startedAt = dragStartedAtRef.current;
    dragStartYRef.current = null;
    dragStartedAtRef.current = 0;
    cancelScheduledDragFrame();

    if (shouldDismissDrag(releasedOffset, startedAt)) {
      dragOffsetRef.current = getDismissDragOffset();
      setIsDragging(false);
      setDragOffset(dragOffsetRef.current);
      dismissTimerRef.current = globalThis.setTimeout(() => {
        dismissTimerRef.current = null;
        handleClose();
      }, DISMISS_DRAG_SETTLE_MS);
      return;
    }

    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, [canDragToClose, cancelScheduledDragFrame, handleClose, resetDrag]);

  const handleAfterLeave = useCallback(() => {
    resetDrag();
    onAfterLeave?.();
  }, [onAfterLeave, resetDrag]);

  const dragTouchHandlers = useMemo(
    () =>
      getDragTouchHandlers({
        canDragToClose,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        resetDrag,
      }),
    [canDragToClose, handleDragStart, handleDragMove, handleDragEnd, resetDrag]
  );

  return {
    canDragToClose,
    dragOffset,
    dragTouchHandlers,
    handleAfterLeave,
    handleClose,
    isDragging,
  };
}
