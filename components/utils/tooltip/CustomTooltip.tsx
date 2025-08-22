"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const showTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const getOptimalPlacement = useCallback((childRect: DOMRect, tooltipRect: DOMRect) => {
    if (placement !== "auto") return placement;
    
    const padding = 8;
    const arrowSize = 8;
    const spaces = {
      top: childRect.top - padding,
      bottom: window.innerHeight - childRect.bottom - padding,
      left: childRect.left - padding,
      right: window.innerWidth - childRect.right - padding
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
    let { x, y } = position;
    let finalPlacement = targetPlacement;
    
    // Keep tooltip within viewport bounds horizontally
    const maxX = window.innerWidth - tooltipRect.width - padding;
    x = Math.max(padding, Math.min(x, maxX));
    
    // Adjust vertical position to prevent overlap
    if (targetPlacement === "top" && y < padding) {
      finalPlacement = "bottom";
      y = childRect.bottom + offset;
    } else if (targetPlacement === "bottom" && y + tooltipRect.height > window.innerHeight - padding) {
      finalPlacement = "top";
      y = childRect.top - tooltipRect.height - offset;
    } else if (targetPlacement === "left" && x < padding) {
      finalPlacement = "right";
      x = childRect.right + offset;
    } else if (targetPlacement === "right" && x + tooltipRect.width > window.innerWidth - padding) {
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
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [disabled, delayShow]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setIsVisible(false), delayHide);
  }, [delayHide]);

  useEffect(() => {
    if (isVisible) {
      // Double RAF ensures DOM is fully updated before measuring
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const child = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      (children.props as any).onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      (children.props as any).onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      (children.props as any).onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      (children.props as any).onBlur?.(e);
    },
  } as any);

  return (
    <>
      {child}
      {isVisible && typeof document !== 'undefined' && createPortal(
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