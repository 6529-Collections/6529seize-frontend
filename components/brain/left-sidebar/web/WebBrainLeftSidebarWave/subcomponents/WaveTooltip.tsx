import type { ReactNode, ComponentProps } from "react";
import type { Tooltip } from "react-tooltip";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

export type WaveTooltipPlacement = ComponentProps<typeof Tooltip>["place"];

interface WaveTooltipProps {
  readonly id: string;
  readonly place: WaveTooltipPlacement;
  readonly children: ReactNode;
}

// Subwave rows animate with transforms, which would otherwise make them the
// containing block for a fixed tooltip and clip it at the sidebar edge.
export const WaveTooltip = ({ id, place, children }: WaveTooltipProps) => (
  <BodyPortalTooltip
    id={id}
    {...(place && { place })}
    opacity={1}
    style={TOOLTIP_STYLES}
  >
    {children}
  </BodyPortalTooltip>
);
