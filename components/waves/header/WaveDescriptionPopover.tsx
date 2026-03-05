"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { DropSize } from "@/helpers/waves/drop.helpers";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Drop, { DropLocation } from "../drops/Drop";

const DESKTOP_SIDE_PADDING = 12;
const MOBILE_BREAKPOINT = 1024;
const DESKTOP_MAX_WIDTH = 672;

interface WaveDescriptionPopoverProps {
  readonly wave: ApiWave;
  readonly children: React.ReactNode;
  readonly ariaLabel: string;
  readonly triggerClassName?: string | undefined;
  readonly align?: "left" | "center" | "right" | undefined;
}

interface PanelPlacement {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
  readonly width?: number;
  readonly maxHeight?: number;
}

const getDesktopLeft = (
  align: "left" | "center" | "right",
  buttonRect: DOMRect,
  panelWidth: number
): number => {
  if (align === "right") {
    return buttonRect.right - panelWidth;
  }
  if (align === "center") {
    return buttonRect.left + (buttonRect.width - panelWidth) / 2;
  }
  return buttonRect.left;
};

const getPlacement = (
  buttonRect: DOMRect,
  panelHeight: number,
  align: "left" | "center" | "right"
): PanelPlacement => {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const topSpace = buttonRect.top;
  const bottomSpace = window.innerHeight - buttonRect.bottom;
  const placeBelow = bottomSpace >= panelHeight || bottomSpace >= topSpace;
  const maxHeight = Math.max(
    120,
    (placeBelow ? bottomSpace : topSpace) - DESKTOP_SIDE_PADDING
  );
  const verticalPlacement = placeBelow
    ? { top: buttonRect.bottom + 8 }
    : { bottom: window.innerHeight - buttonRect.top + 8 };

  if (isMobile) {
    return {
      ...verticalPlacement,
      left: DESKTOP_SIDE_PADDING,
      right: DESKTOP_SIDE_PADDING,
      maxHeight,
    };
  }

  const panelWidth = Math.min(
    DESKTOP_MAX_WIDTH,
    window.innerWidth - DESKTOP_SIDE_PADDING * 2
  );
  const preferredLeft = getDesktopLeft(align, buttonRect, panelWidth);
  const clampedLeft = Math.min(
    Math.max(preferredLeft, DESKTOP_SIDE_PADDING),
    window.innerWidth - panelWidth - DESKTOP_SIDE_PADDING
  );

  return {
    ...verticalPlacement,
    left: clampedLeft,
    width: panelWidth,
    maxHeight,
  };
};

const WaveDescriptionPopover: React.FC<WaveDescriptionPopoverProps> = ({
  wave,
  children,
  ariaLabel,
  triggerClassName,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<PanelPlacement>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePlacement = () => {
      const buttonRect = triggerRef.current?.getBoundingClientRect();
      if (!buttonRect) {
        return;
      }
      const panelHeight =
        panelRef.current?.getBoundingClientRect().height ?? 320;
      setPlacement(getPlacement(buttonRect, panelHeight, align));
    };

    updatePlacement();
    const rafId = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePlacement);
    };
  }, [align, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen]);

  if (!wave.description_drop.id) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={triggerClassName}
      >
        {children}
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "absolute",
              top: placement.top,
              bottom: placement.bottom,
              left: placement.left,
              right: placement.right,
              width: placement.width,
              maxHeight: placement.maxHeight,
            }}
            className="tw-z-[1200] tw-space-y-1 tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-iron-800 tw-p-1 tw-shadow-xl tw-ring-1 tw-ring-iron-800 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
          >
            <Drop
              drop={{
                type: DropSize.FULL,
                ...wave.description_drop,
                stableKey: wave.description_drop.id,
                stableHash: wave.description_drop.id,
              }}
              showWaveInfo={false}
              activeDrop={null}
              dropViewDropId={null}
              onReplyClick={() => {}}
              showReplyAndQuote={false}
              location={DropLocation.WAVE}
              onReply={() => {}}
              previousDrop={null}
              nextDrop={null}
              onQuoteClick={() => {}}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default WaveDescriptionPopover;
