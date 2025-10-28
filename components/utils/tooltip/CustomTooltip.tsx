"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  MutableRefObject,
} from "react";
import { createPortal } from "react-dom";
import styles from "./CustomTooltip.module.scss";

interface CustomTooltipProps {
  readonly children: React.ReactElement;
  readonly content: React.ReactNode;
  readonly placement?: "top" | "bottom" | "left" | "right" | "auto";
  readonly delayShow?: number;
  readonly delayHide?: number;
  readonly disabled?: boolean;
  readonly offset?: number;
}

type TooltipChildHandlers = {
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
};

const globalScope = globalThis as typeof globalThis & { window?: Window };
const win = globalScope.window ?? null;
const isBrowser = win !== null;

export default function CustomTooltip({
  children,
  content,
  placement = "top",
  delayShow = 700,
  delayHide = 0,
  disabled = false,
  offset = 8,
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const [actualPlacement, setActualPlacement] = useState<"top" | "bottom" | "left" | "right">(
    placement === "auto" ? "bottom" : placement
  );

  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const childObserverRef: MutableRefObject<ResizeObserver | null> = useRef(null);
  const tooltipObserverRef: MutableRefObject<ResizeObserver | null> = useRef(null);
  const childElement = React.Children.only(children) as React.ReactElement<TooltipChildHandlers>;
  const originalRef = (childElement as React.ReactElement & {
    ref?: React.Ref<HTMLElement>;
  }).ref;

  const setRefValue = useCallback((ref: React.Ref<HTMLElement> | undefined, node: HTMLElement | null) => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(node);
      return;
    }
    try {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    } catch {
      if (typeof console !== "undefined") {
        console.warn("[CustomTooltip] Failed to assign ref (may be read-only)");
      }
    }
  }, []);

  const assignChildNode = useCallback(
    (node: HTMLElement | null) => {
      childRef.current = node;

      if (node && typeof node.getBoundingClientRect !== "function") {
        console.warn(
          "[CustomTooltip] Child ref is not an HTMLElement; tooltip positioning may fail."
        );
      }

      setRefValue(originalRef, node);

      if (isVisible && childObserverRef.current) {
        try {
          childObserverRef.current.disconnect();
          if (node) {
            childObserverRef.current.observe(node);
          }
        } catch {
          // Ignore observer errors
        }
      }
    },
    [originalRef, setRefValue, isVisible]
  );

  const mergeHandlers = useCallback(
    <E extends React.SyntheticEvent>(ourHandler: (event: E) => void, theirHandler?: (event: E) => void) =>
      (event: E) => {
        ourHandler(event);
        theirHandler?.(event);
      },
    []
  );

  const getOptimalPlacement = useCallback((childRect: DOMRect, tooltipRect: DOMRect) => {
    if (placement !== "auto") return placement;

    const padding = 8;
    const arrowSize = 8;
    const viewportHeight = win ? win.innerHeight : 0;
    const viewportWidth = win ? win.innerWidth : 0;
    const spaces = {
      top: childRect.top - padding,
      bottom: viewportHeight - childRect.bottom - padding,
      left: childRect.left - padding,
      right: viewportWidth - childRect.right - padding
    };
    
    const requiredVerticalSpace = tooltipRect.height + offset + arrowSize;
    const requiredHorizontalSpace = tooltipRect.width + offset + arrowSize;
    
    const placements = [
      { name: "top", space: spaces.top, required: requiredVerticalSpace },
      { name: "bottom", space: spaces.bottom, required: requiredVerticalSpace },
      { name: "right", space: spaces.right, required: requiredHorizontalSpace },
      { name: "left", space: spaces.left, required: requiredHorizontalSpace }
    ] as const;
    
    const validPlacement = placements.find(p => p.space >= p.required);
    return validPlacement ? validPlacement.name : "bottom";
  }, [placement, offset]);

  const calculateInitialPosition = useCallback((childRect: DOMRect, tooltipRect: DOMRect, targetPlacement: string) => {
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
  }, [offset]);

  const adjustPositionForViewport = useCallback((position: { x: number, y: number }, childRect: DOMRect, tooltipRect: DOMRect, targetPlacement: string) => {
    const padding = 8;
    const viewportHeight = win ? win.innerHeight : 0;
    const viewportWidth = win ? win.innerWidth : 0;
    let { x, y } = position;
    let finalPlacement = targetPlacement;

    // Keep tooltip within viewport bounds horizontally
    const maxX = viewportWidth - tooltipRect.width - padding;
    x = Math.max(padding, Math.min(x, maxX));
    
    // Adjust vertical position to prevent overlap
    if (targetPlacement === "top" && y < padding) {
      finalPlacement = "bottom";
      y = childRect.bottom + offset;
    } else if (targetPlacement === "bottom" && y + tooltipRect.height > viewportHeight - padding) {
      finalPlacement = "top";
      y = childRect.top - tooltipRect.height - offset;
    } else if (targetPlacement === "left" && x < padding) {
      finalPlacement = "right";
      x = childRect.right + offset;
    } else if (targetPlacement === "right" && x + tooltipRect.width > viewportWidth - padding) {
      finalPlacement = "left";
      x = childRect.left - tooltipRect.width - offset;
    }
    
    return { x, y, finalPlacement };
  }, [offset]);

  const calculateArrowPosition = useCallback((position: { x: number, y: number }, childRect: DOMRect, tooltipRect: DOMRect, finalPlacement: string) => {
    let arrowX = 0;
    let arrowY = 0;
    
    if (finalPlacement === "top" || finalPlacement === "bottom") {
      const childCenterX = childRect.left + childRect.width / 2;
      arrowX = childCenterX - position.x;
      arrowX = Math.max(16, Math.min(arrowX, tooltipRect.width - 16));
    } else if (finalPlacement === "left" || finalPlacement === "right") {
      const childCenterY = childRect.top + childRect.height / 2;
      arrowY = childCenterY - position.y;
      arrowY = Math.max(16, Math.min(arrowY, tooltipRect.height - 16));
    }
    
    return { x: arrowX, y: arrowY };
  }, []);

  const calculatePosition = useCallback(() => {
    if (!childRef.current || !tooltipRef.current) return;
    if (!isBrowser) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const targetPlacement = getOptimalPlacement(childRect, tooltipRect);
    const initialPosition = calculateInitialPosition(childRect, tooltipRect, targetPlacement);
    const adjustedPosition = adjustPositionForViewport(initialPosition, childRect, tooltipRect, targetPlacement);
    const arrowPos = calculateArrowPosition(adjustedPosition, childRect, tooltipRect, adjustedPosition.finalPlacement);

    setPosition({ x: adjustedPosition.x, y: adjustedPosition.y });
    setArrowPosition(arrowPos);
    setActualPlacement(adjustedPosition.finalPlacement as "top" | "bottom" | "left" | "right");
  }, [getOptimalPlacement, calculateInitialPosition, adjustPositionForViewport, calculateArrowPosition]);

  const show = useCallback(() => {
    if (disabled) return;
    if (hideTimer.current !== undefined) {
      clearTimeout(hideTimer.current);
    }
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [disabled, delayShow]);

  const hide = useCallback(() => {
    if (showTimer.current !== undefined) {
      clearTimeout(showTimer.current);
    }
    hideTimer.current = setTimeout(() => setIsVisible(false), delayHide);
  }, [delayHide]);

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
    if (!isBrowser) return;

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
    if (!childRef.current) return;
    if (!isBrowser) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });

    childObserverRef.current = observer;
    observer.observe(childRef.current);

    return () => {
      observer.disconnect();
      childObserverRef.current = null;
    };
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;
    if (!isBrowser) return;

    let rafId: number | null = null;
    const handleReposition = () => {
      if (rafId !== null) return;
      rafId = win.requestAnimationFrame(() => {
        rafId = null;
        calculatePosition();
      });
    };

    win.addEventListener("resize", handleReposition);
    win.addEventListener("scroll", handleReposition, true);

    return () => {
      win.removeEventListener("resize", handleReposition);
      win.removeEventListener("scroll", handleReposition, true);
      if (rafId !== null) {
        win.cancelAnimationFrame(rafId);
      }
    };
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      if (showTimer.current !== undefined) {
        clearTimeout(showTimer.current);
      }
      if (hideTimer.current !== undefined) {
        clearTimeout(hideTimer.current);
      }
      childObserverRef.current?.disconnect();
      tooltipObserverRef.current?.disconnect();
    };
  }, []);

  const clonedChild = React.cloneElement(
    childElement,
    {
      ref: assignChildNode,
      onMouseEnter: mergeHandlers<React.MouseEvent<HTMLElement>>(
        () => {
          show();
        },
        childElement.props.onMouseEnter
      ),
      onMouseLeave: mergeHandlers<React.MouseEvent<HTMLElement>>(
        () => {
          hide();
        },
        childElement.props.onMouseLeave
      ),
      onFocus: mergeHandlers<React.FocusEvent<HTMLElement>>(
        () => {
          show();
        },
        childElement.props.onFocus
      ),
      onBlur: mergeHandlers<React.FocusEvent<HTMLElement>>(
        () => {
          hide();
        },
        childElement.props.onBlur
      ),
    } as React.Attributes & TooltipChildHandlers
  );

  return (
    <>
      {clonedChild}
      {isVisible && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`${styles.tooltip} ${styles["tooltip--" + actualPlacement]}`}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 999999,
            pointerEvents: 'none',
          }}
        >
          <div className={styles.tooltipContent}>
            {content}
          </div>
          <div 
            className={`${styles.tooltipArrow} ${styles["tooltipArrow--" + actualPlacement]}`}
            style={{
              ...(actualPlacement === "top" || actualPlacement === "bottom") && {
                left: `${arrowPosition.x}px`,
                transform: 'translateX(-50%)'
              },
              ...(actualPlacement === "left" || actualPlacement === "right") && {
                top: `${arrowPosition.y}px`,
                transform: 'translateY(-50%)'
              }
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
