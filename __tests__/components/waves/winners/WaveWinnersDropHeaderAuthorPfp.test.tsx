import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveWinnersDropHeaderAuthorPfp from '@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorPfp';

const baseWinner = { drop: { author: { pfp: null } } } as any;

describe('WaveWinnersDropHeaderAuthorPfp', () => {
  it('renders author image when available', () => {
    const winner = { drop: { author: { pfp: 'image.png' } } } as any;
    render(<WaveWinnersDropHeaderAuthorPfp winner={winner} />);
    const img = screen.getByAltText('Profile picture');
    expect(img).toHaveAttribute('src', 'image.png');
  });

  it('renders placeholder when no image', () => {
    const { container } = render(<WaveWinnersDropHeaderAuthorPfp winner={baseWinner} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
