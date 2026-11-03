import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveWinnersDropHeaderAuthorPfp from '@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorPfp';
import { ImageScale } from '@/helpers/image.helpers';
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from '@/__tests__/utils/avatarSrc';

const baseWinner = { drop: { author: { pfp: null } } } as any;

describe('WaveWinnersDropHeaderAuthorPfp', () => {
  it('renders author image when available', () => {
    const winner = { drop: { author: { pfp: 'image.png' } } } as any;
    render(<WaveWinnersDropHeaderAuthorPfp winner={winner} />);
    const img = screen.getByAltText('Profile picture');
    expect(img).toHaveAttribute('src', 'image.png');
  });

  it('requests the AUTOx50 derivative of a CDN profile picture', () => {
    const winner = { drop: { author: { pfp: CDN_AVATAR_URL } } } as any;
    render(<WaveWinnersDropHeaderAuthorPfp winner={winner} />);
    expect(getRequestedImageSrc(screen.getByAltText('Profile picture'))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it('renders placeholder when no image', () => {
    const { container } = render(<WaveWinnersDropHeaderAuthorPfp winner={baseWinner} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
