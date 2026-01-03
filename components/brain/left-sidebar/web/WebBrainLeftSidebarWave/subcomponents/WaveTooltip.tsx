import type { ReactNode, ComponentProps } from "react";
import { Tooltip } from "react-tooltip";

export type WaveTooltipPlacement = ComponentProps<typeof Tooltip>["place"];

interface WaveTooltipProps {
  readonly id: string;
  readonly place: WaveTooltipPlacement;
  readonly children: ReactNode;
}

export const WaveTooltip = ({ id, place, children }: WaveTooltipProps) => (
  <Tooltip
    id={id}
    {...(place && { place })}
    positionStrategy="fixed"
    className="tw-bg-[#37373E] tw-text-white tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-medium tw-rounded-md tw-shadow-[0_4px_12px_rgba(0,0,0,0.3)] tw-z-[10000]"
  >
    <span className="tw-text-xs">{children}</span>
  </Tooltip>
);
