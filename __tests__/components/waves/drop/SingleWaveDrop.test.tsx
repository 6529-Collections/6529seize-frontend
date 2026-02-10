import { render, screen } from '@testing-library/react';
import React from 'react';
import { SingleWaveDrop } from '@/components/waves/drop/SingleWaveDrop';

jest.mock('@/components/waves/drop/DefaultSingleWaveDrop', () => ({
  __esModule: true,
  DefaultSingleWaveDrop: () => <div data-testid="default" />,
}));

jest.mock('@/components/waves/drop/MemesSingleWaveDrop', () => ({
  __esModule: true,
  MemesSingleWaveDrop: () => <div data-testid="memes" />,
}));

const useSettings = jest.fn();

jest.mock('@/contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: () => ({ isMemesWave: useSettings }),
}));

describe('SingleWaveDrop', () => {
  const drop: any = { wave: { id: 'w1' } };
  const onClose = jest.fn();

  it('renders memes drop when wave is memes', () => {
    useSettings.mockReturnValue(true);
    render(<SingleWaveDrop drop={drop} onClose={onClose} />);
    expect(screen.getByTestId('memes')).toBeInTheDocument();
  });

  it('renders default drop otherwise', () => {
    useSettings.mockReturnValue(false);
    render(<SingleWaveDrop drop={drop} onClose={onClose} />);
    expect(screen.getByTestId('default')).toBeInTheDocument();
  });
});
