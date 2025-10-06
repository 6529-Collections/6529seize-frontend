import { render, screen } from '@testing-library/react';
import React from 'react';
import ParticipationDrop from '@/components/waves/drops/participation/ParticipationDrop';
import { DropLocation } from '@/components/waves/drops/Drop';

jest.mock('@/contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: jest.fn()
}));

jest.mock('@/components/memes/drops/MemeParticipationDrop', () => (props: any) => (
  <div data-testid="meme" {...props} />
));

jest.mock('@/components/waves/drops/participation/DefaultParticipationDrop', () => (props: any) => (
  <div data-testid="default" {...props} />
));

const { useSeizeSettings } = require('@/contexts/SeizeSettingsContext');

describe('ParticipationDrop', () => {
  const baseProps = {
    drop: { wave: { id: '1' } } as any,
    showWaveInfo: false,
    activeDrop: null,
    showReplyAndQuote: true,
    location: DropLocation.FEED,
    onReply: jest.fn(),
    onQuote: jest.fn(),
    onQuoteClick: jest.fn()
  };

  it('renders meme drop when wave is memes', () => {
    useSeizeSettings.mockReturnValue({ isMemesWave: () => true });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId('meme')).toBeInTheDocument();
  });

  it('renders default drop otherwise', () => {
    useSeizeSettings.mockReturnValue({ isMemesWave: () => false });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId('default')).toBeInTheDocument();
  });
});
