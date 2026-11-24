import {
  useCallback,
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type MouseEvent,
} from "react";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "@/hooks/useLongPressInteraction";

const canStartSelection = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  const control = target.closest(
    "a, button, input, textarea, select, label, [tabindex], [data-vote-controls]"
  );
  return !control || control.hasAttribute("data-my-vote-open");
};

export function useMyVoteLongPress(enabled: boolean, onSelect: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const held = useRef(false);
  const suppression = useLongPressClickSuppression();
  const cancel = useCallback(() => {
    if (timer.current) globalThis.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useLayoutEffect(() => cancel, [enabled, cancel]);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      cancel();
      held.current = false;
      if (
        !enabled ||
        event.pointerType === "mouse" ||
        !event.isPrimary ||
        !canStartSelection(event.target)
      )
        return;
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = globalThis.setTimeout(() => {
        timer.current = null;
        held.current = true;
        suppression.markNextClickForSuppression();
        onSelect();
      }, DEFAULT_LONG_PRESS_DURATION_MS);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!timer.current) return;
      if (
        Math.hypot(
          event.clientX - origin.current.x,
          event.clientY - origin.current.y
        ) > 10
      )
        cancel();
    },
    onPointerUp: () => {
      cancel();
      held.current = false;
      suppression.releaseSuppressionAfterTouchEnd();
    },
    onPointerCancel: () => {
      cancel();
      held.current = false;
      suppression.clearSuppression();
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (event.detail !== 0) suppression.handleClickCapture(event);
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (
        (timer.current !== null || held.current) &&
        canStartSelection(event.target)
      )
        event.preventDefault();
    },
  };
}
