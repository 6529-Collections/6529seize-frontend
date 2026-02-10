import React from 'react';
import { render, screen } from '@testing-library/react';
import { DefaultSingleWaveDrop } from '@/components/waves/drop/DefaultSingleWaveDrop';

jest.mock('@/components/waves/drop/SingleWaveDropWrapper', () => ({
  __esModule: true,
  SingleWaveDropWrapper: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock('@/components/waves/drop/SingleWaveDropInfoPanel', () => ({
  __esModule: true,
  SingleWaveDropInfoPanel: () => <div data-testid="info-panel" />,
}));

jest.mock('@/hooks/useDrop', () => ({ useDrop: () => ({ drop: { id: '1', wave: { id: 'w1' } } }) }));
jest.mock('@/hooks/useWaveData', () => ({ useWaveData: () => ({ data: { id: 'w1' } }) }));

describe('DefaultSingleWaveDrop', () => {
  it('renders wrapper with info panel', () => {
    render(<DefaultSingleWaveDrop drop={{ id: '1', wave: { id: 'w1' }, stableHash: 'sh', stableKey: 'sk' } as any} onClose={jest.fn()} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('info-panel')).toBeInTheDocument();
  });
});
