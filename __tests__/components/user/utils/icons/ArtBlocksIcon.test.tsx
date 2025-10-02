import { render, screen } from '@testing-library/react';
import React from 'react';
import ArtBlocksIcon from '@/components/user/utils/icons/ArtBlocksIcon';

describe('ArtBlocksIcon', () => {
  it('renders img with expected attributes', () => {
    render(<ArtBlocksIcon />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/Art-Blocks-icon.jpg');
    expect(img).toHaveAttribute('alt', 'Art Blocks');
  });
});
