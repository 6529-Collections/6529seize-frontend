export type TooltipPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type ResolvedTooltipPlacement = Exclude<TooltipPlacement, "auto">;

export type TooltipCoordinates = { x: number; y: number };

type TooltipLayout = {
  position: TooltipCoordinates;
  arrowPosition: TooltipCoordinates;
  placement: ResolvedTooltipPlacement;
};

const VIEWPORT_PADDING = 8;
const ARROW_SIZE = 8;
const ARROW_EDGE_PADDING = 16;

export const getTooltipWindow = (): Window | null => globalThis.window;

export const joinTooltipClassNames = (
  ...classNames: ReadonlyArray<string | undefined>
): string =>
  classNames
    .filter((className): className is string => className !== undefined)
    .join(" ");

export function resolveTooltipTriggerElement(
  boundaryElement: HTMLElement | null
): HTMLElement | null {
  if (boundaryElement === null) {
    return null;
  }

  if (boundaryElement.firstElementChild instanceof HTMLElement) {
    return boundaryElement.firstElementChild;
  }

  return boundaryElement.querySelector<HTMLElement>("*");
}

function getOptimalPlacement(
  childRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
  offset: number
): ResolvedTooltipPlacement {
  if (placement !== "auto") {
    return placement;
  }

  const browserWindow = getTooltipWindow();
  const viewportHeight = browserWindow?.innerHeight ?? 0;
  const viewportWidth = browserWindow?.innerWidth ?? 0;
  const spaces = {
    top: childRect.top - VIEWPORT_PADDING,
    bottom: viewportHeight - childRect.bottom - VIEWPORT_PADDING,
    left: childRect.left - VIEWPORT_PADDING,
    right: viewportWidth - childRect.right - VIEWPORT_PADDING,
  };

  const requiredVerticalSpace = tooltipRect.height + offset + ARROW_SIZE;
  const requiredHorizontalSpace = tooltipRect.width + offset + ARROW_SIZE;

  const placements = [
    { name: "top", space: spaces.top, required: requiredVerticalSpace },
    {
      name: "bottom",
      space: spaces.bottom,
      required: requiredVerticalSpace,
    },
    {
      name: "right",
      space: spaces.right,
      required: requiredHorizontalSpace,
    },
    { name: "left", space: spaces.left, required: requiredHorizontalSpace },
  ] as const;

  const validPlacement = placements.find(
    (candidate) => candidate.space >= candidate.required
  );

  return validPlacement ? validPlacement.name : "bottom";
}

function calculateInitialPosition(
  childRect: DOMRect,
  tooltipRect: DOMRect,
  placement: ResolvedTooltipPlacement,
  offset: number
): TooltipCoordinates {
  let x = 0;
  let y = 0;

  switch (placement) {
    case "top":
      x = childRect.left + (childRect.width - tooltipRect.width) / 2;
      y = childRect.top - tooltipRect.height - offset;
      break;
    case "bottom":
      x = childRect.left + (childRect.width - tooltipRect.width) / 2;
      y = childRect.bottom + offset;
      break;
    case "left":
      x = childRect.left - tooltipRect.width - offset;
      y = childRect.top + (childRect.height - tooltipRect.height) / 2;
      break;
    case "right":
      x = childRect.right + offset;
      y = childRect.top + (childRect.height - tooltipRect.height) / 2;
      break;
  }

  return { x, y };
}

function adjustPositionForViewport(
  initialPosition: TooltipCoordinates,
  childRect: DOMRect,
  tooltipRect: DOMRect,
  placement: ResolvedTooltipPlacement,
  offset: number
): { x: number; y: number; placement: ResolvedTooltipPlacement } {
  const browserWindow = getTooltipWindow();
  const viewportHeight = browserWindow?.innerHeight ?? 0;
  const viewportWidth = browserWindow?.innerWidth ?? 0;
  let { x, y } = initialPosition;
  let resolvedPlacement = placement;

  const maxX = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
  x = Math.max(VIEWPORT_PADDING, Math.min(x, maxX));

  if (placement === "top" && y < VIEWPORT_PADDING) {
    resolvedPlacement = "bottom";
    y = childRect.bottom + offset;
  } else if (
    placement === "bottom" &&
    y + tooltipRect.height > viewportHeight - VIEWPORT_PADDING
  ) {
    resolvedPlacement = "top";
    y = childRect.top - tooltipRect.height - offset;
  } else if (placement === "left" && x < VIEWPORT_PADDING) {
    resolvedPlacement = "right";
    x = childRect.right + offset;
  } else if (
    placement === "right" &&
    x + tooltipRect.width > viewportWidth - VIEWPORT_PADDING
  ) {
    resolvedPlacement = "left";
    x = childRect.left - tooltipRect.width - offset;
  }

  const maxY = viewportHeight - tooltipRect.height - VIEWPORT_PADDING;
  y = Math.max(VIEWPORT_PADDING, Math.min(y, maxY));

  return { x, y, placement: resolvedPlacement };
}

function calculateArrowPosition(
  tooltipPosition: TooltipCoordinates,
  childRect: DOMRect,
  tooltipRect: DOMRect,
  placement: ResolvedTooltipPlacement
): TooltipCoordinates {
  let arrowX = 0;
  let arrowY = 0;

  if (placement === "top" || placement === "bottom") {
    const childCenterX = childRect.left + childRect.width / 2;
    arrowX = childCenterX - tooltipPosition.x;
    arrowX = Math.max(
      ARROW_EDGE_PADDING,
      Math.min(arrowX, tooltipRect.width - ARROW_EDGE_PADDING)
    );
  } else {
    const childCenterY = childRect.top + childRect.height / 2;
    arrowY = childCenterY - tooltipPosition.y;
    arrowY = Math.max(
      ARROW_EDGE_PADDING,
      Math.min(arrowY, tooltipRect.height - ARROW_EDGE_PADDING)
    );
  }

  return { x: arrowX, y: arrowY };
}

export function calculateTooltipLayout({
  childRect,
  tooltipRect,
  placement,
  offset,
}: {
  childRect: DOMRect;
  tooltipRect: DOMRect;
  placement: TooltipPlacement;
  offset: number;
}): TooltipLayout {
  const targetPlacement = getOptimalPlacement(
    childRect,
    tooltipRect,
    placement,
    offset
  );
  const initialPosition = calculateInitialPosition(
    childRect,
    tooltipRect,
    targetPlacement,
    offset
  );
  const adjustedPosition = adjustPositionForViewport(
    initialPosition,
    childRect,
    tooltipRect,
    targetPlacement,
    offset
  );

  return {
    position: {
      x: adjustedPosition.x,
      y: adjustedPosition.y,
    },
    arrowPosition: calculateArrowPosition(
      adjustedPosition,
      childRect,
      tooltipRect,
      adjustedPosition.placement
    ),
    placement: adjustedPosition.placement,
  };
}
