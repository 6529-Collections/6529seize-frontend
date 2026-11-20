import { useCallback, useLayoutEffect, useRef } from "react";

const MEMETIC_VALUES = [
  -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
];
const REPEAT_MS = 100;
const SNAP_PAUSE_MS = 1000;

export interface VoteNumericAdjustments {
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}

export function clampVote(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function stepSize(elapsedMs: number) {
  if (elapsedMs < 2000) return 1;
  if (elapsedMs < 4000) return 10;
  if (elapsedMs < 6000) return 100;
  return 1000;
}

export function useVoteNumericSteps(
  adjustments: VoteNumericAdjustments | undefined,
  disabled: boolean
) {
  const value = useRef(adjustments?.value ?? 0);
  const onChange = useRef(adjustments?.onChange);
  const pointerDirection = useRef<-1 | 1 | null>(null);
  const hold = useRef<{
    direction: -1 | 1;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const min = adjustments?.min;
  const max = adjustments?.max;
  const stop = useCallback((direction?: -1 | 1) => {
    if (
      !hold.current ||
      (direction !== undefined && hold.current.direction !== direction)
    )
      return;
    clearTimeout(hold.current.timer);
    hold.current = null;
  }, []);

  useLayoutEffect(() => {
    value.current = adjustments?.value ?? 0;
    onChange.current = adjustments?.onChange;
  }, [adjustments]);
  // Stop an active hold when permissions/limits change or the field unmounts.
  useLayoutEffect(() => stop, [stop, disabled, min, max]);

  const setValue = (next: number) => {
    if (disabled || min === undefined || max === undefined) return;
    value.current = clampVote(next, min, max);
    onChange.current?.(value.current);
  };

  const step = (direction: -1 | 1, elapsedMs = 0) => {
    const delta = stepSize(elapsedMs);
    const from = value.current;
    const next = from + direction * delta;
    const snap =
      direction === 1
        ? MEMETIC_VALUES.find((point) => point > from && point <= next)
        : MEMETIC_VALUES.findLast((point) => point < from && point >= next);
    setValue(snap ?? Math.round(next / delta) * delta);
    return snap !== undefined;
  };

  const start = (direction: -1 | 1) => {
    if (disabled || min === undefined || max === undefined) return;
    stop();
    pointerDirection.current = direction;
    const startedAt = Date.now();
    const repeat = () => {
      const snapped = step(direction, Date.now() - startedAt);
      hold.current = {
        direction,
        timer: setTimeout(repeat, REPEAT_MS + (snapped ? SNAP_PAUSE_MS : 0)),
      };
    };
    repeat();
  };

  const click = (direction: -1 | 1, detail: number) => {
    // Pointer release/blur stops the timer before the following click arrives.
    const fromPointer = pointerDirection.current === direction;
    pointerDirection.current = null;
    stop();
    if (detail === 0 && !fromPointer) step(direction);
  };

  const resetPointer = () => {
    pointerDirection.current = null;
    stop();
  };

  return { setValue, start, stop, click, resetPointer };
}
