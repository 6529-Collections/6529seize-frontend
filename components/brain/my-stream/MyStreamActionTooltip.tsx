"use client";

import type { ComponentProps } from "react";
import type { Tooltip } from "react-tooltip";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

interface MyStreamActionTooltipProps {
  readonly id: string;
  readonly place?: ComponentProps<typeof Tooltip>["place"];
}

const tooltipStyle = {
  ...TOOLTIP_STYLES,
  maxWidth: "min(20rem, calc(100vw - 2rem))",
  whiteSpace: "normal",
} as const;

export default function MyStreamActionTooltip({
  id,
  place = "top",
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
      style={tooltipStyle}
    />
  );
}
