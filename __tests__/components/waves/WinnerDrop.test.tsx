import { render } from '@testing-library/react';
import React from 'react';
import WinnerDrop from '../../../components/waves/drops/winner/WinnerDrop';

jest.mock('../../../components/memes/drops/MemeWinnerDrop', () => (props: any) => <div data-testid="meme" />);
jest.mock('../../../components/waves/drops/winner/DefaultWinnerDrop', () => (props: any) => <div data-testid="default" />);

jest.mock('../../../contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: () => ({ isMemesWave: (id: string) => id === 'meme' })
}));

describe('WinnerDrop', () => {
  const baseProps: any = { drop: { wave: { id: 'wave' } }, previousDrop: null, nextDrop: null, showWaveInfo: false, activeDrop: null, showReplyAndQuote: false, location: 'feed', dropViewDropId: null, onReply: jest.fn(), onQuote: jest.fn(), onReplyClick: jest.fn(), onQuoteClick: jest.fn() };

  it('renders meme winner when wave is memes', () => {
    const { getByTestId } = render(<WinnerDrop {...baseProps} drop={{ wave:{ id:'meme'}}} />);
    expect(getByTestId('meme')).toBeInTheDocument();
  });

  it('renders default winner otherwise', () => {
    const { getByTestId } = render(<WinnerDrop {...baseProps} />);
    expect(getByTestId('default')).toBeInTheDocument();
  });
});
