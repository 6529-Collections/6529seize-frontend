import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropsEmptyPlaceholder from '../../../../components/waves/drops/WaveDropsEmptyPlaceholder';

describe('WaveDropsEmptyPlaceholder', () => {
  it('shows subtitle when drop id present', () => {
    render(<WaveDropsEmptyPlaceholder dropId="1" />);
    expect(screen.getByText('Share your thoughts and join the discussion.')).toBeInTheDocument();
  });

  it('hides subtitle when drop id not provided', () => {
    render(<WaveDropsEmptyPlaceholder dropId={null} />);
    expect(screen.queryByText('Share your thoughts and join the discussion.')).toBeNull();
  });
});
