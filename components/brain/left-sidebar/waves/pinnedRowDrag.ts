import {
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PinnedWaveTouchSensor } from "./PinnedWaveTouchSensor";

export function usePinnedRowSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(PinnedWaveTouchSensor, { delay: 200 }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab],
        cancel: [KeyboardCode.Esc],
      },
    })
  );
}

export function canDragPinnedRowFrom(target: EventTarget) {
  return (
    target instanceof Element &&
    !target.closest("button, input, select, textarea, [role='button']")
  );
}

export function suppressPinnedRowDropClick({
  activatorEvent,
}: DragEndEvent | DragCancelEvent) {
  if (activatorEvent instanceof KeyboardEvent) return;

  // The release click can still activate a link's browser default action.
  const controller = new AbortController();
  const options = { capture: true, signal: controller.signal };
  const clear = () => controller.abort();
  document.addEventListener(
    "click",
    (event) => {
      if (event.detail > 0) {
        event.preventDefault();
        clear();
      }
    },
    options
  );
  document.addEventListener("pointerdown", clear, options);
  globalThis.setTimeout(clear, 100);
}
