"use client";

import { type ComponentProps, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";

interface MyStreamActionTooltipProps {
  readonly id: string;
  readonly place?: ComponentProps<typeof Tooltip>["place"];
}

const tooltipStyle = {
  padding: "4px 8px",
  background: "#37373E",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  borderRadius: "6px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  maxWidth: "min(20rem, calc(100vw - 2rem))",
  whiteSpace: "normal",
  zIndex: 99999,
  pointerEvents: "none",
} as const;

export default function MyStreamActionTooltip({
  id,
  place = "top",
}: MyStreamActionTooltipProps) {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!hydrated) {
    return null;
  }

  return createPortal(
    <Tooltip
      id={id}
      place={place}
      offset={8}
      opacity={1}
      positionStrategy="fixed"
      style={tooltipStyle}
    />,
    document.body
  );
}
