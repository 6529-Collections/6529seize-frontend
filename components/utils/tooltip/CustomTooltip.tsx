"use client";

import type { RefObject } from "react";
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";
import styles from "./CustomTooltip.module.scss";
import {
  calculateTooltipLayout,
  getTooltipWindow,
  joinTooltipClassNames,
  resolveTooltipTriggerElement,
  type ResolvedTooltipPlacement,
  type TooltipCoordinates,
} from "./tooltipPositioning";

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

const ARIA_DESCRIBED_BY_ATTRIBUTE = "aria-describedby";

function getAriaDescribedByIds(element: HTMLElement): string[] {
  return (element.getAttribute(ARIA_DESCRIBED_BY_ATTRIBUTE) ?? "")
    .split(/\s+/)
    .filter(Boolean);
}

function addAriaDescribedById(
  element: HTMLElement,
  descriptionId: string
): void {
  const describedByIds = getAriaDescribedByIds(element);

  if (describedByIds.includes(descriptionId)) {
    return;
  }

  element.setAttribute(
    ARIA_DESCRIBED_BY_ATTRIBUTE,
    [...describedByIds, descriptionId].join(" ")
  );
}

function removeAriaDescribedById(
  element: HTMLElement,
  descriptionId: string
): void {
  const describedByIds = getAriaDescribedByIds(element).filter(
    (describedById) => describedById !== descriptionId
  );

  if (describedByIds.length === 0) {
    element.removeAttribute(ARIA_DESCRIBED_BY_ATTRIBUTE);
    return;
  }

  element.setAttribute(ARIA_DESCRIBED_BY_ATTRIBUTE, describedByIds.join(" "));
}

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
  const tooltipId = `${useId()}-tooltip`;

  const triggerBoundaryRef = useRef<HTMLSpanElement>(null);
  const childNodeRef = useRef<HTMLElement | null>(null);
  const observedChildNodeRef = useRef<HTMLElement | null>(null);
  const describedTriggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const childObserverRef: RefObject<ResizeObserver | null> = useRef(null);
  const tooltipObserverRef: RefObject<ResizeObserver | null> = useRef(null);

  const resolveTriggerNode = useCallback(() => {
    const nextTriggerNode = resolveTooltipTriggerElement(
      triggerBoundaryRef.current
    );
    childNodeRef.current = nextTriggerNode;
    return nextTriggerNode;
  }, []);

  const getCurrentTriggerNode = useCallback(() => {
    const currentTriggerNode = childNodeRef.current;

    if (
      currentTriggerNode &&
      triggerBoundaryRef.current?.contains(currentTriggerNode)
    ) {
      return currentTriggerNode;
    }

    return resolveTriggerNode();
  }, [resolveTriggerNode]);

  const clearTooltipDescription = useCallback(
    (target?: HTMLElement | null) => {
      const describedTrigger = target ?? describedTriggerRef.current;
      if (!describedTrigger) {
        return;
      }

      removeAriaDescribedById(describedTrigger, tooltipId);

      if (describedTriggerRef.current === describedTrigger) {
        describedTriggerRef.current = null;
      }
    },
    [tooltipId]
  );

  const syncTooltipDescription = useCallback(() => {
    const nextTriggerNode = getCurrentTriggerNode();
    const previousTriggerNode = describedTriggerRef.current;

    if (previousTriggerNode && previousTriggerNode !== nextTriggerNode) {
      clearTooltipDescription(previousTriggerNode);
    }

    if (!isVisible || !tooltipRef.current || !nextTriggerNode) {
      clearTooltipDescription();
      return;
    }

    addAriaDescribedById(nextTriggerNode, tooltipId);
    describedTriggerRef.current = nextTriggerNode;
  }, [clearTooltipDescription, getCurrentTriggerNode, isVisible, tooltipId]);

  const syncChildObserverNode = useCallback(
    (observer?: ResizeObserver | null) => {
      const nextChildNode = getCurrentTriggerNode() ?? resolveTriggerNode();
      const observedChildNode = observedChildNodeRef.current;

      if (observedChildNode && observedChildNode !== nextChildNode) {
        observer?.unobserve(observedChildNode);
        observedChildNodeRef.current = null;
      }

      if (!observer || !nextChildNode) {
        return nextChildNode;
      }

      if (observedChildNode !== nextChildNode) {
        observer.observe(nextChildNode);
        observedChildNodeRef.current = nextChildNode;
      }

      return nextChildNode;
    },
    [getCurrentTriggerNode, resolveTriggerNode]
  );

  const calculatePosition = useCallback(() => {
    const childNode = getCurrentTriggerNode() ?? resolveTriggerNode();
    if (!childNode || !tooltipRef.current) return;
    if (getTooltipWindow() === null) return;

    const childRect = childNode.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement,
      offset,
    });

    setPosition(layout.position);
    setArrowPosition(layout.arrowPosition);
    setActualPlacement(layout.placement);
  }, [getCurrentTriggerNode, offset, placement, resolveTriggerNode]);

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
    cancelShowTimer();
    cancelHideTimer();
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [cancelHideTimer, cancelShowTimer, delayShow, disabled]);

  const hide = useCallback(() => {
    cancelShowTimer();
    cancelHideTimer();
    hideTimer.current = setTimeout(
      () => setIsVisible(false),
      delayHide + hoverTransitionDelay
    );
  }, [cancelHideTimer, cancelShowTimer, delayHide, hoverTransitionDelay]);

  const handleTriggerMouseEnter = useCallback(() => {
    resolveTriggerNode();
    show();
  }, [resolveTriggerNode, show]);

  const handleTriggerMouseLeave = useCallback(() => {
    hide();
  }, [hide]);

  const handleTriggerFocus = useCallback(() => {
    resolveTriggerNode();
    show();
  }, [resolveTriggerNode, show]);

  const handleTriggerBlur = useCallback(
    (event: React.FocusEvent<HTMLSpanElement>) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (triggerBoundaryRef.current?.contains(nextTarget)) {
        return;
      }
      hide();
    },
    [hide]
  );

  const closeTooltipImmediately = useCallback(() => {
    cancelShowTimer();
    cancelHideTimer();
    setIsVisible(false);
  }, [cancelShowTimer, cancelHideTimer]);

  useLayoutEffect(() => {
    syncTooltipDescription();
  });

  useLayoutEffect(() => {
    if (!isVisible) return;

    const observer = childObserverRef.current;
    if (!observer) return;

    const previousObservedChildNode = observedChildNodeRef.current;
    const childNode = syncChildObserverNode(observer);
    if (!childNode || previousObservedChildNode === childNode) return;

    calculatePosition();
  });

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
    if (getTooltipWindow() === null) return;

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
    if (getTooltipWindow() === null) return;

    const childNode = getCurrentTriggerNode() ?? resolveTriggerNode();
    if (!childNode) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      const nextChildNode = syncChildObserverNode(observer);
      if (!nextChildNode) return;

      calculatePosition();
    });

    childObserverRef.current = observer;
    observedChildNodeRef.current = childNode;
    observer.observe(childNode);

    return () => {
      if (observedChildNodeRef.current) {
        observer.unobserve(observedChildNodeRef.current);
        observedChildNodeRef.current = null;
      }
      observer.disconnect();
      childObserverRef.current = null;
    };
  }, [
    isVisible,
    calculatePosition,
    getCurrentTriggerNode,
    resolveTriggerNode,
    syncChildObserverNode,
  ]);

  useEffect(() => {
    if (!isVisible) return;
    const browserWindow = getTooltipWindow();
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
      observedChildNodeRef.current = null;
      tooltipObserverRef.current?.disconnect();
      clearTooltipDescription();
    };
  }, [cancelShowTimer, cancelHideTimer, clearTooltipDescription]);

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
      <span
        ref={triggerBoundaryRef}
        role="presentation"
        style={{ display: "contents" }}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        onFocus={handleTriggerFocus}
        onBlur={handleTriggerBlur}
      >
        {children}
      </span>
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={joinTooltipClassNames(
              styles["tooltip"],
              styles["tooltip--" + actualPlacement]
            )}
            style={{
              position: "fixed",
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 999999,
              pointerEvents: "none",
            }}
          >
            <div className={styles["tooltipContent"]}>{content}</div>
            <div
              className={joinTooltipClassNames(
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
