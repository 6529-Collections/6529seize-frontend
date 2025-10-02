import { render, screen } from '@testing-library/react';
import React from 'react';

const registerRef = jest.fn();

jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ registerRef }),
}));

jest.mock('@/hooks/useWave', () => ({
  useWave: jest.fn(),
}));

jest.mock('@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme', () => ({
  __esModule: true,
  default: () => <div data-testid="meme" />,
}));

jest.mock('@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault', () => ({
  __esModule: true,
  default: () => <div data-testid="default" />,
}));

import { MyStreamWaveTabs } from '@/components/brain/my-stream/tabs/MyStreamWaveTabs';
import { ApiWave } from '@/generated/models/ApiWave';
const { useWave } = require('@/hooks/useWave');

describe('MyStreamWaveTabs', () => {
  const wave: ApiWave = { id: 'w1', name: 'Wave 1' } as ApiWave;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meme tabs when wave is a memes wave and registers ref', () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: true });
    render(<MyStreamWaveTabs wave={wave} />);
    const container = document.getElementById('tabs-container');
    expect(screen.getByTestId('meme')).toBeInTheDocument();
    expect(screen.queryByTestId('default')).toBeNull();
    expect(registerRef).toHaveBeenCalledWith('tabs', container);
  });

  it('renders default tabs when wave is not a memes wave', () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: false });
    render(<MyStreamWaveTabs wave={wave} />);
    expect(screen.getByTestId('default')).toBeInTheDocument();
    expect(screen.queryByTestId('meme')).toBeNull();
  });
});
