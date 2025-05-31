import React from 'react';
import { render } from '@testing-library/react';
import { WaveWinnersPodiumPlaceholder } from '../../../../../components/waves/winners/podium/WaveWinnersPodiumPlaceholder';

describe('WaveWinnersPodiumPlaceholder', () => {
  it('applies color based on position', () => {
    const { container } = render(<WaveWinnersPodiumPlaceholder height="h-4" position="second" />);
    expect(container.firstChild?.querySelector('div.tw-border-iron-700\\/20')).toBeTruthy();
  });
});
