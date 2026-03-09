"use client";

import type { RefObject } from "react";
import React, {
  useCallback,
  useEffect,
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
  type TooltipPlacement,
} from "./tooltipPositioning";

interface HoverCardProps {
  readonly children: React.ReactElement;
  readonly content: React.ReactNode;
  readonly placement?: TooltipPlacement | undefined;
  readonly delayShow?: number | undefined;
  readonly delayHide?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly offset?: number | undefined;
  readonly hoverTransitionDelay?: number | undefined;
}
export default function HoverCard({
  children,
  content,
  placement = "top",
  delayShow = 700,
  delayHide = 0,
  disabled = false,
  offset = 8,
  hoverTransitionDelay = 150,
}: HoverCardProps) {
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

  const triggerBoundaryRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const focusCardOnOpenRef = useRef(false);
  const childObserverRef: RefObject<ResizeObserver | null> = useRef(null);
  const cardObserverRef: RefObject<ResizeObserver | null> = useRef(null);
  const isPointerOverCardRef = useRef(false);
  const isFocusWithinCardRef = useRef(false);

  const resolveTriggerNode = useCallback(() => {
    const nextTriggerNode = resolveTooltipTriggerElement(
      triggerBoundaryRef.current
    );
    triggerRef.current = nextTriggerNode;
    return nextTriggerNode;
  }, []);

  const calculatePosition = useCallback(() => {
    const triggerNode = triggerRef.current ?? resolveTriggerNode();
    if (!triggerNode || !cardRef.current) return;
    if (getTooltipWindow() === null) return;

    const layout = calculateTooltipLayout({
      childRect: triggerNode.getBoundingClientRect(),
      tooltipRect: cardRef.current.getBoundingClientRect(),
      placement,
      offset,
    });

    setPosition(layout.position);
    setArrowPosition(layout.arrowPosition);
    setActualPlacement(layout.placement);
  }, [offset, placement, resolveTriggerNode]);

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

  const resetCardInteractionState = useCallback(() => {
    cancelShowTimer();
    cancelHideTimer();
    isPointerOverCardRef.current = false;
    isFocusWithinCardRef.current = false;
    focusCardOnOpenRef.current = false;
  }, [cancelHideTimer, cancelShowTimer]);

  const show = useCallback(() => {
    if (disabled) return;
    resetCardInteractionState();
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [delayShow, disabled, resetCardInteractionState]);

  const showImmediately = useCallback(
    ({ focusCard = false }: { focusCard?: boolean } = {}) => {
      if (disabled) return;
      resetCardInteractionState();
      focusCardOnOpenRef.current = focusCard;
      setIsVisible(true);
    },
    [disabled, resetCardInteractionState]
  );

  const hide = useCallback(() => {
    cancelShowTimer();
    cancelHideTimer();
    if (isPointerOverCardRef.current || isFocusWithinCardRef.current) {
      return;
    }

    hideTimer.current = setTimeout(
      () => setIsVisible(false),
      delayHide + hoverTransitionDelay
    );
  }, [cancelHideTimer, cancelShowTimer, delayHide, hoverTransitionDelay]);

  const closeCardImmediately = useCallback(() => {
    resetCardInteractionState();
    setIsVisible(false);
  }, [resetCardInteractionState]);

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
      if (
        cardRef.current?.contains(nextTarget) ||
        triggerBoundaryRef.current?.contains(nextTarget)
      ) {
        return;
      }

      hide();
    },
    [hide]
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        closeCardImmediately();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        resolveTriggerNode();
        showImmediately({ focusCard: true });
      }
    },
    [closeCardImmediately, resolveTriggerNode, showImmediately]
  );

  const handleCardMouseEnter = useCallback(() => {
    isPointerOverCardRef.current = true;
    cancelHideTimer();
  }, [cancelHideTimer]);

  const handleCardMouseLeave = useCallback(() => {
    isPointerOverCardRef.current = false;
    hide();
  }, [hide]);

  const handleCardFocus = useCallback(() => {
    isFocusWithinCardRef.current = true;
    cancelHideTimer();
  }, [cancelHideTimer]);

  const handleCardBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (
        cardRef.current?.contains(nextTarget) ||
        triggerBoundaryRef.current?.contains(nextTarget)
      ) {
        return;
      }

      isFocusWithinCardRef.current = false;
      hide();
    },
    [hide]
  );

  const syncCardRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    if (!node || !focusCardOnOpenRef.current) {
      return;
    }

    focusCardOnOpenRef.current = false;
    node.focus();
  }, []);

  if (disabled && isVisible) {
    setIsVisible(false);
  }

  useLayoutEffect(() => {
    if (!isVisible) return;

    const frame = requestAnimationFrame(() => {
      calculatePosition();
    });

    return () => cancelAnimationFrame(frame);
  }, [calculatePosition, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    if (!cardRef.current) return;
    if (getTooltipWindow() === null) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });

    cardObserverRef.current = observer;
    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      cardObserverRef.current = null;
    };
  }, [calculatePosition, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    if (getTooltipWindow() === null) return;

    const triggerNode = triggerRef.current ?? resolveTriggerNode();
    if (!triggerNode) return;

    if (typeof ResizeObserver === "undefined") {
      calculatePosition();
      return;
    }

    const observer = new ResizeObserver(() => {
      calculatePosition();
    });

    childObserverRef.current = observer;
    observer.observe(triggerNode);

    return () => {
      observer.disconnect();
      childObserverRef.current = null;
    };
  }, [calculatePosition, isVisible, resolveTriggerNode]);

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
  }, [calculatePosition, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCardImmediately();
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        triggerBoundaryRef.current?.contains(target) ||
        cardRef.current?.contains(target)
      ) {
        return;
      }

      closeCardImmediately();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [closeCardImmediately, isVisible]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleCloseAll = () => {
      closeCardImmediately();
    };

    document.addEventListener(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT, handleCloseAll);

    return () => {
      document.removeEventListener(
        CUSTOM_TOOLTIP_CLOSE_ALL_EVENT,
        handleCloseAll
      );
    };
  }, [closeCardImmediately]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    resetCardInteractionState();
  }, [disabled, resetCardInteractionState]);

  useEffect(() => {
    return () => {
      resetCardInteractionState();
      childObserverRef.current?.disconnect();
      cardObserverRef.current?.disconnect();
    };
  }, [resetCardInteractionState]);

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
        onKeyDown={handleTriggerKeyDown}
      >
        {children}
      </span>
      {isVisible && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={syncCardRef}
              role="dialog"
              aria-modal="false"
              tabIndex={-1}
              className={joinTooltipClassNames(
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
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              onFocus={handleCardFocus}
              onBlur={handleCardBlur}
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
          )
        : null}
    </>
  );
}
