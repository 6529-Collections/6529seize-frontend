import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemesSingleWaveDrop } from '@/components/waves/drop/MemesSingleWaveDrop';

jest.mock('@/components/waves/drop/SingleWaveDropWrapper', () => ({
  __esModule: true,
  SingleWaveDropWrapper: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock('@/components/waves/drop/MemesSingleWaveDropInfoPanel', () => ({
  __esModule: true,
  MemesSingleWaveDropInfoPanel: (props: any) => <div data-testid="info-panel" data-wave={props.wave?.id} />,
}));

jest.mock('@/hooks/useDrop', () => ({ useDrop: () => ({ drop: { id: 'd1', wave: { id: 'w1' } } }) }));
jest.mock('@/hooks/useWaveData', () => ({ useWaveData: () => ({ data: { id: 'w1' } }) }));

describe('MemesSingleWaveDrop', () => {
  it('renders wrapper with memes info panel', () => {
    render(<MemesSingleWaveDrop drop={{ id: 'd1', wave: { id: 'w1' }, stableHash: 'sh', stableKey: 'sk' } as any} onClose={jest.fn()} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('info-panel')).toHaveAttribute('data-wave', 'w1');
  });
});
