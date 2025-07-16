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
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  
  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const calculatePosition = useCallback(() => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Mark initial calculation as done
    setInitialCalculationDone(true);
    const padding = 8;
    const arrowSize = 8;
    
    let x = 0;
    let y = 0;
    let finalPlacement = placement === "auto" ? "bottom" : placement;

    // Simplified auto placement logic with priority-based selection
    if (placement === "auto") {
      // Calculate available space in all directions
      const spaces = {
        top: childRect.top - padding,
        bottom: window.innerHeight - childRect.bottom - padding,
        left: childRect.left - padding,
        right: window.innerWidth - childRect.right - padding
      };
      
      // Required space includes tooltip height, offset, and arrow size
      const requiredVerticalSpace = tooltipRect.height + offset + arrowSize;
      const requiredHorizontalSpace = tooltipRect.width + offset + arrowSize;
      
      // Priority order: bottom, top, right, left
      const placements = [
        { name: "bottom", space: spaces.bottom, required: requiredVerticalSpace },
        { name: "top", space: spaces.top, required: requiredVerticalSpace },
        { name: "right", space: spaces.right, required: requiredHorizontalSpace },
        { name: "left", space: spaces.left, required: requiredHorizontalSpace }
      ] as const;
      
      // Find first placement that fits, or fallback to bottom
      const validPlacement = placements.find(p => p.space >= p.required);
      finalPlacement = validPlacement ? validPlacement.name : "bottom";
    }

    // Calculate initial position based on placement
    switch (finalPlacement) {
      case "top":
        x = childRect.left + (childRect.width - tooltipRect.width) / 2;
        y = childRect.top - tooltipRect.height - offset - 12; // Extra 12px spacing for top
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


    // Keep tooltip within viewport bounds horizontally only
    const maxX = window.innerWidth - tooltipRect.width - padding;
    x = Math.max(padding, Math.min(x, maxX));

    // STRICT enforcement: tooltip must NEVER overlap with element
    if (finalPlacement === "top") {
      // Force tooltip to be above the element, even if it goes off-screen
      y = childRect.top - tooltipRect.height - offset - 12; // Extra 12px spacing for top
      // Only apply viewport constraint if it doesn't cause overlap
      if (y < padding) {
        // If tooltip would go off-screen at top, force it to bottom instead
        finalPlacement = "bottom";
        y = childRect.bottom + offset;
      }
    } else if (finalPlacement === "bottom") {
      // Force tooltip to be below the element, even if it goes off-screen
      y = childRect.bottom + offset;
      // Only apply viewport constraint if it doesn't cause overlap
      if (y + tooltipRect.height > window.innerHeight - padding) {
        // If tooltip would go off-screen at bottom, force it to top instead
        finalPlacement = "top";
        y = childRect.top - tooltipRect.height - offset - 12; // Extra 12px spacing for top
      }
    } else if (finalPlacement === "left") {
      x = childRect.left - tooltipRect.width - offset;
      if (x < padding) {
        finalPlacement = "right";
        x = childRect.right + offset;
      }
    } else if (finalPlacement === "right") {
      x = childRect.right + offset;
      if (x + tooltipRect.width > window.innerWidth - padding) {
        finalPlacement = "left";
        x = childRect.left - tooltipRect.width - offset;
      }
    }

    // Calculate arrow position based on the difference between intended and actual position
    let arrowX = 0;
    let arrowY = 0;
    
    if (finalPlacement === "top" || finalPlacement === "bottom") {
      // For top/bottom, arrow should point to the center of the child element
      const childCenterX = childRect.left + childRect.width / 2;
      const tooltipLeftX = x;
      arrowX = childCenterX - tooltipLeftX;
      // Clamp arrow position within tooltip bounds with some margin
      arrowX = Math.max(16, Math.min(arrowX, tooltipRect.width - 16));
    } else if (finalPlacement === "left" || finalPlacement === "right") {
      // For left/right, arrow should point to the center of the child element
      const childCenterY = childRect.top + childRect.height / 2;
      const tooltipTopY = y;
      arrowY = childCenterY - tooltipTopY;
      // Clamp arrow position within tooltip bounds with some margin
      arrowY = Math.max(16, Math.min(arrowY, tooltipRect.height - 16));
    }

    setPosition({ x, y });
    setArrowPosition({ x: arrowX, y: arrowY });
    setActualPlacement(finalPlacement); // Use the final placement (may have changed due to constraints)
  }, [placement, offset]);

  const show = useCallback(() => {
    if (disabled) return;
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      setIsVisible(true);
      setInitialCalculationDone(false); // Reset for fresh calculation
    }, delayShow);
  }, [disabled, delayShow]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setIsVisible(false), delayHide);
  }, [delayHide]);

  useEffect(() => {
    if (isVisible && !initialCalculationDone) {
      // Calculate position ONLY ONCE when tooltip first appears
      const raf = requestAnimationFrame(() => {
        calculatePosition();
      });
      
      return () => {
        cancelAnimationFrame(raf);
      };
    }
  }, [isVisible, calculatePosition, initialCalculationDone]);

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
          className={`${styles.tooltip} ${styles[`tooltip--${actualPlacement}`]}`}
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
            className={`${styles.tooltipArrow} ${styles[`tooltipArrow--${actualPlacement}`]}`}
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