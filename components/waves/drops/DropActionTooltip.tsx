"use client";

import { TOOLTIP_STYLES, buildTooltipId } from "@/helpers/tooltip.helpers";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";

interface DropActionTooltipProps {
  readonly children: ReactElement;
  readonly content: ReactNode;
  readonly disabled?: boolean | undefined;
  readonly style?: CSSProperties | undefined;
}

const CLOSE_DROP_ACTION_TOOLTIPS_EVENT = "drop-action-tooltip:close";

export default function DropActionTooltip({
  children,
  content,
  disabled = false,
  style,
}: DropActionTooltipProps) {
  const tooltipId = buildTooltipId("drop-action", useId());
  const [isOpen, setIsOpen] = useState(false);
  const suppressPointerFocus = useRef(false);
  const close = useCallback(() => setIsOpen(false), []);
  const visible = isOpen && !disabled;

  const open = () => {
    // Switching between keyboard and pointer input must not stack labels.
    document.dispatchEvent(new Event(CLOSE_DROP_ACTION_TOOLTIPS_EVENT));
    setIsOpen(true);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>) => {
    if (
      !disabled &&
      (event.pointerType === "mouse" || event.pointerType === "pen")
    ) {
      open();
    }
  };

  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (
      !disabled &&
      !suppressPointerFocus.current &&
      event.target.matches(":focus-visible")
    ) {
      open();
    }
  };

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    // Capture catches scrolling in every ancestor, including nested lists.
    window.addEventListener("scroll", close, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", close);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", close, true);
    document.addEventListener(CLOSE_DROP_ACTION_TOOLTIPS_EVENT, close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", close, true);
      document.removeEventListener(CLOSE_DROP_ACTION_TOOLTIPS_EVENT, close);
    };
  }, [close, visible]);

  return (
    <>
      <span
        role="presentation"
        style={{ display: "contents" }}
        data-drop-action-tooltip={tooltipId}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={close}
        onClickCapture={close}
        onPointerDownCapture={() => {
          suppressPointerFocus.current = true;
          close();
        }}
        onKeyDownCapture={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            event.key === "Escape"
          ) {
            close();
          }
        }}
        onFocus={handleFocus}
        onBlur={() => {
          suppressPointerFocus.current = false;
          close();
        }}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <Tooltip
            id={tooltipId}
            anchorSelect={`[data-drop-action-tooltip="${tooltipId}"] > :first-child`}
            className="tailwind-scope"
            isOpen
            imperativeModeOnly
            place="top"
            positionStrategy="fixed"
            offset={8}
            opacity={1}
            style={{
              ...(style ?? TOOLTIP_STYLES),
              zIndex: TOOLTIP_STYLES.zIndex,
              pointerEvents: "none",
            }}
          >
            {content}
          </Tooltip>,
          document.body
        )}
    </>
  );
}
