import { useLayoutEffect, useRef, useState } from "react";

interface Position {
  top: number;
  left: number;
}

interface UsePopoverPositionOptions {
  offset?: number;
  viewportPadding?: number;
}

export function usePopoverPosition(
  triggerPosition: Position,
  options: UsePopoverPositionOptions = {}
) {
  const { offset = 0, viewportPadding = 16 } = options;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<Position>({
    top: triggerPosition.top,
    left: triggerPosition.left + offset,
  });

  useLayoutEffect(() => {
    // For full-height flyout, always position at top
    setAdjustedPosition({
      top: 0,
      left: triggerPosition.left + offset
    });
  }, [triggerPosition.left, offset]);

  return { popoverRef, position: adjustedPosition };
}