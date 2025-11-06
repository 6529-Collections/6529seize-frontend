import type { CSSProperties, ReactNode } from 'react';
import type { ComponentProps } from 'react';
import { Tooltip } from 'react-tooltip';

const TOOLTIP_STYLE: CSSProperties = {
  background: '#37373E',
  color: 'white',
  padding: '6px 10px',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  zIndex: 10000,
};

export type WaveTooltipPlacement = ComponentProps<typeof Tooltip>['place'];

interface WaveTooltipProps {
  readonly id: string;
  readonly place: WaveTooltipPlacement;
  readonly children: ReactNode;
}

export const WaveTooltip = ({ id, place, children }: WaveTooltipProps) => (
  <Tooltip id={id} place={place} positionStrategy="fixed" style={TOOLTIP_STYLE}>
    <span className="tw-text-xs">{children}</span>
  </Tooltip>
);
