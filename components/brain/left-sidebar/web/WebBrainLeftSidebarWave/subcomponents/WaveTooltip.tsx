import type { ReactNode, ComponentProps } from "react";
import type { Tooltip } from "react-tooltip";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";

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
    className="tw-z-[10000] tw-rounded-md tw-bg-[#37373E] tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-medium tw-text-white tw-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
  >
    <span className="tw-text-xs">{children}</span>
  </BodyPortalTooltip>
);
