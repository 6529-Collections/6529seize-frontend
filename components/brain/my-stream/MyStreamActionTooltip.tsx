"use client";

import type { ComponentProps } from "react";
import type { Tooltip } from "react-tooltip";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import {
  SIDEBAR_TOOLTIP_BORDER,
  SIDEBAR_TOOLTIP_STYLE,
} from "@/components/brain/left-sidebar/waves/SidebarCategoryLabel";

interface MyStreamActionTooltipProps {
  readonly id: string;
  readonly place?: ComponentProps<typeof Tooltip>["place"];
  readonly variant?: "default" | "wave-header";
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

const waveHeaderTooltipStyle = {
  ...tooltipStyle,
  ...SIDEBAR_TOOLTIP_STYLE,
} as const;

export default function MyStreamActionTooltip({
  id,
  place = "top",
  variant = "default",
}: MyStreamActionTooltipProps) {
  const isTouchDevice = useIsTouchDevice();
  if (isTouchDevice) return null;

  return (
    <BodyPortalTooltip
      id={id}
      place={place}
      offset={8}
      globalCloseEvents={{ clickOutsideAnchor: true, scroll: true }}
      closeEvents={{ mouseleave: true, blur: true, click: true }}
      opacity={1}
      border={variant === "wave-header" ? SIDEBAR_TOOLTIP_BORDER : undefined}
      style={variant === "wave-header" ? waveHeaderTooltipStyle : tooltipStyle}
    />
  );
}
