import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTAttributes from '../../../components/nftAttributes/NFTAttributes';

describe('NFTAttributes', () => {
  it('renders each attribute', () => {
    const attrs = [
      { trait_type: 'Color', value: 'Red' },
      { trait_type: 'Size', value: 'Large' }
    ] as any;
    render(<NFTAttributes attributes={attrs} />);
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });
});
