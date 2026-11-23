import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";
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
  const cancel = () => {
    if (timer.current) globalThis.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, [enabled]);

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
      suppression.releaseSuppressionAfterTouchEnd();
    },
    onPointerCancel: cancel,
    onClickCapture: suppression.handleClickCapture,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if ((enabled || held.current) && canStartSelection(event.target))
        event.preventDefault();
    },
  };
}
