"use client";

import type { RefObject } from "react";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";
import styles from "./CustomTooltip.module.scss";

interface CustomTooltipProps {
  readonly children: React.ReactElement;
  readonly content: React.ReactNode;
  readonly placement?: "top" | "bottom" | "left" | "right" | "auto" | undefined;
  readonly delayShow?: number | undefined;
  readonly delayHide?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly offset?: number | undefined;
  readonly hoverTransitionDelay?: number | undefined;
}

type TooltipPlacement = NonNullable<CustomTooltipProps["placement"]>;
type ResolvedTooltipPlacement = Exclude<TooltipPlacement, "auto">;
type TooltipCoordinates = { x: number; y: number };

type TooltipChildHandlers = {
  onMouseEnter?: React.MouseEventHandler<HTMLElement> | undefined;
  onMouseLeave?: React.MouseEventHandler<HTMLElement> | undefined;
  onFocus?: React.FocusEventHandler<HTMLElement> | undefined;
  onBlur?: React.FocusEventHandler<HTMLElement> | undefined;
};

const getWindow = (): Window | null =>
  typeof window === "undefined" ? null : window;

const joinClassNames = (
  ...classNames: ReadonlyArray<string | undefined>
): string =>
  classNames
    .filter((className): className is string => className !== undefined)
    .join(" ");

export default function CustomTooltip({
  children,
  content,
  placement = "top",
  delayShow = 700,
  delayHide = 0,
  disabled = false,
  offset = 8,
  hoverTransitionDelay = 150,
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipCoordinates>({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState<TooltipCoordinates>({
    x: 0,
    y: 0,
  });
  const [actualPlacement, setActualPlacement] =
    useState<ResolvedTooltipPlacement>(
      placement === "auto" ? "bottom" : placement
    );

  const childNodeRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const childObserverRef: RefObject<ResizeObserver | null> = useRef(null);
  const tooltipObserverRef: RefObject<ResizeObserver | null> = useRef(null);
  const isPointerOverTooltipRef = useRef(false);
  const childElement = React.Children.only(
    children
  ) as React.ReactElement<TooltipChildHandlers>;
  const ChildComponent = childElement.type as React.ElementType;
  const {
    onMouseEnter: childOnMouseEnter,
    onMouseLeave: childOnMouseLeave,
    onFocus: childOnFocus,
    onBlur: childOnBlur,
  } = childElement.props;

  const getOptimalPlacement = useCallback(
    (childRect: DOMRect, tooltipRect: DOMRect): ResolvedTooltipPlacement => {
      if (placement !== "auto") return placement;

      const browserWindow = getWindow();
      const padding = 8;
      const arrowSize = 8;
      const viewportHeight = browserWindow?.innerHeight ?? 0;
      const viewportWidth = browserWindow?.innerWidth ?? 0;
      const spaces = {
        top: childRect.top - padding,
        bottom: viewportHeight - childRect.bottom - padding,
        left: childRect.left - padding,
        right: viewportWidth - childRect.right - padding,
      };

      const requiredVerticalSpace = tooltipRect.height + offset + arrowSize;
      const requiredHorizontalSpace = tooltipRect.width + offset + arrowSize;

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

      const validPlacement = placements.find((p) => p.space >= p.required);
      return validPlacement ? validPlacement.name : "bottom";
    },
    [placement, offset]
  );

  const calculateInitialPosition = useCallback(
    (
      childRect: DOMRect,
      tooltipRect: DOMRect,
      targetPlacement: ResolvedTooltipPlacement
    ): TooltipCoordinates => {
      let x = 0;
      let y = 0;

      switch (targetPlacement) {
        case "top":
          x = childRect.left;
          y = childRect.top - tooltipRect.height - offset;
          break;
        case "bottom":
          x = childRect.left;
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
    },
    [offset]
  );

  const adjustPositionForViewport = useCallback(
    (
      initialPosition: TooltipCoordinates,
      childRect: DOMRect,
      tooltipRect: DOMRect,
      targetPlacement: ResolvedTooltipPlacement
    ) => {
      const browserWindow = getWindow();
      const padding = 8;
      const viewportHeight = browserWindow?.innerHeight ?? 0;
      const viewportWidth = browserWindow?.innerWidth ?? 0;
      let { x, y } = initialPosition;
      let finalPlacement = targetPlacement;

      // Keep tooltip within viewport bounds horizontally
      const maxX = viewportWidth - tooltipRect.width - padding;
      x = Math.max(padding, Math.min(x, maxX));

      // Adjust vertical position to prevent overlap
      if (targetPlacement === "top" && y < padding) {
        finalPlacement = "bottom";
        y = childRect.bottom + offset;
      } else if (
        targetPlacement === "bottom" &&
        y + tooltipRect.height > viewportHeight - padding
      ) {
        finalPlacement = "top";
        y = childRect.top - tooltipRect.height - offset;
      } else if (targetPlacement === "left" && x < padding) {
        finalPlacement = "right";
        x = childRect.right + offset;
      } else if (
        targetPlacement === "right" &&
        x + tooltipRect.width > viewportWidth - padding
      ) {
        finalPlacement = "left";
        x = childRect.left - tooltipRect.width - offset;
      }

      return { x, y, finalPlacement };
    },
    [offset]
  );

  const calculateArrowPosition = useCallback(
    (
      tooltipPosition: TooltipCoordinates,
      childRect: DOMRect,
      tooltipRect: DOMRect,
      finalPlacement: ResolvedTooltipPlacement
    ): TooltipCoordinates => {
      let arrowX = 0;
      let arrowY = 0;

      if (finalPlacement === "top" || finalPlacement === "bottom") {
        const childCenterX = childRect.left + childRect.width / 2;
        arrowX = childCenterX - tooltipPosition.x;
        arrowX = Math.max(16, Math.min(arrowX, tooltipRect.width - 16));
      } else if (finalPlacement === "left" || finalPlacement === "right") {
        const childCenterY = childRect.top + childRect.height / 2;
        arrowY = childCenterY - tooltipPosition.y;
        arrowY = Math.max(16, Math.min(arrowY, tooltipRect.height - 16));
      }

      return { x: arrowX, y: arrowY };
    },
    []
  );

  const calculatePosition = useCallback(() => {
    const childNode = childNodeRef.current;
    if (!childNode || !tooltipRef.current) return;
    if (getWindow() === null) return;

    const childRect = childNode.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const targetPlacement = getOptimalPlacement(childRect, tooltipRect);
    const initialPosition = calculateInitialPosition(
      childRect,
      tooltipRect,
      targetPlacement
    );
    const adjustedPosition = adjustPositionForViewport(
      initialPosition,
      childRect,
      tooltipRect,
      targetPlacement
    );
    const arrowPos = calculateArrowPosition(
      adjustedPosition,
      childRect,
      tooltipRect,
      adjustedPosition.finalPlacement
    );

    setPosition({ x: adjustedPosition.x, y: adjustedPosition.y });
    setArrowPosition(arrowPos);
    setActualPlacement(adjustedPosition.finalPlacement);
  }, [
    getOptimalPlacement,
    calculateInitialPosition,
    adjustPositionForViewport,
    calculateArrowPosition,
  ]);

  const cancelShowTimer = useCallback(() => {
    if (showTimer.current !== undefined) {
      clearTimeout(showTimer.current);
      showTimer.current = undefined;
    }
  }, []);

  const cancelHideTimer = useCallback(() => {
    if (hideTimer.current !== undefined) {
      clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }
  }, []);

  const show = useCallback(() => {
    if (disabled) return;
    cancelHideTimer();
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [disabled, delayShow, cancelHideTimer]);

  const hide = useCallback(() => {
    cancelShowTimer();
    if (isPointerOverTooltipRef.current) {
      return;
    }
    hideTimer.current = setTimeout(
      () => setIsVisible(false),
      delayHide + hoverTransitionDelay
    );
  }, [delayHide, hoverTransitionDelay, cancelShowTimer]);

  const handleChildMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      childNodeRef.current = event.currentTarget;
      show();
      childOnMouseEnter?.(event);
    },
    [show, childOnMouseEnter]
  );

  const handleChildMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      hide();
      childOnMouseLeave?.(event);
    },
    [hide, childOnMouseLeave]
  );

  const handleChildFocus = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      childNodeRef.current = event.currentTarget;
      show();
      childOnFocus?.(event);
    },
    [show, childOnFocus]
  );

  const handleChildBlur = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      hide();
      childOnBlur?.(event);
    },
    [hide, childOnBlur]
  );

  const handleTooltipMouseEnter = useCallback(() => {
    isPointerOverTooltipRef.current = true;
    cancelHideTimer();
  }, [cancelHideTimer]);

  const handleTooltipMouseLeave = useCallback(() => {
    isPointerOverTooltipRef.current = false;
    hide();
  }, [hide]);

  const closeTooltipImmediately = useCallback(() => {
    cancelShowTimer();
    cancelHideTimer();
    isPointerOverTooltipRef.current = false;
    setIsVisible(false);
  }, [cancelShowTimer, cancelHideTimer]);

  const renderedChild = (
    <ChildComponent
      {...childElement.props}
      onMouseEnter={handleChildMouseEnter}
      onMouseLeave={handleChildMouseLeave}
      onFocus={handleChildFocus}
      onBlur={handleChildBlur}
    />
  );

  useLayoutEffect(() => {
    if (!isVisible) return;

    const frame = requestAnimationFrame(() => {
      calculatePosition();
    });

    return () => cancelAnimationFrame(frame);
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;
    if (!tooltipRef.current) return;
    if (getWindow() === null) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });

    tooltipObserverRef.current = observer;
    observer.observe(tooltipRef.current);

    return () => {
      observer.disconnect();
      tooltipObserverRef.current = null;
    };
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;
    if (getWindow() === null) return;

    const childNode = childNodeRef.current;
    if (!childNode) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });

    childObserverRef.current = observer;
    observer.observe(childNode);

    return () => {
      observer.disconnect();
      childObserverRef.current = null;
    };
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;
    const browserWindow = getWindow();
    if (browserWindow === null) return;

    let rafId: number | null = null;
    const handleReposition = () => {
      if (rafId !== null) return;
      rafId = browserWindow.requestAnimationFrame(() => {
        rafId = null;
        calculatePosition();
      });
    };

    browserWindow.addEventListener("resize", handleReposition);
    browserWindow.addEventListener("scroll", handleReposition, true);

    return () => {
      browserWindow.removeEventListener("resize", handleReposition);
      browserWindow.removeEventListener("scroll", handleReposition, true);
      if (rafId !== null) {
        browserWindow.cancelAnimationFrame(rafId);
      }
    };
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      cancelShowTimer();
      cancelHideTimer();
      childObserverRef.current?.disconnect();
      tooltipObserverRef.current?.disconnect();
    };
  }, [cancelShowTimer, cancelHideTimer]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleCloseAll = () => {
      closeTooltipImmediately();
    };

    document.addEventListener(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT, handleCloseAll);
    return () => {
      document.removeEventListener(
        CUSTOM_TOOLTIP_CLOSE_ALL_EVENT,
        handleCloseAll
      );
    };
  }, [closeTooltipImmediately]);

  return (
    <>
      {renderedChild}
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={joinClassNames(
              styles["tooltip"],
              styles["tooltip--" + actualPlacement]
            )}
            style={{
              position: "fixed",
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 999999,
              pointerEvents: "auto",
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={closeTooltipImmediately}
          >
            <div className={styles["tooltipContent"]}>{content}</div>
            <div
              className={joinClassNames(
                styles["tooltipArrow"],
                styles["tooltipArrow--" + actualPlacement]
              )}
              style={{
                ...((actualPlacement === "top" ||
                  actualPlacement === "bottom") && {
                  left: `${arrowPosition.x}px`,
                  transform: "translateX(-50%)",
                }),
                ...((actualPlacement === "left" ||
                  actualPlacement === "right") && {
                  top: `${arrowPosition.y}px`,
                  transform: "translateY(-50%)",
                }),
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
