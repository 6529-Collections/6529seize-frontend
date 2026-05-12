import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropPartContentMedias from '@/components/waves/drops/WaveDropPartContentMedias';

jest.mock('@/components/drops/view/item/content/media/MediaDisplay', () => ({
  __esModule: true,
  default: () => <div data-testid="media-display" />,
}));

jest.mock('@/components/drops/view/item/content/media/DropListItemContentMedia', () => ({
  __esModule: true,
  default: () => <div data-testid="drop-media" />,
}));

jest.mock('@/components/waves/drops/WaveDropPartContentMediaImage', () => ({
  __esModule: true,
  default: () => <div data-testid="wave-image-media" />,
}));

const basePart: any = {
  content: '',
  media: [
    { mime_type: 'image/png', url: 'u1' },
    { mime_type: 'video/mp4', url: 'u2' },
  ],
};

describe('WaveDropPartContentMedias', () => {
  it('returns null when no media', () => {
    const { container } = render(
      <WaveDropPartContentMedias activePart={{ ...basePart, media: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders standard media actions for image and video media by default', () => {
    render(<WaveDropPartContentMedias activePart={basePart} />);
    expect(screen.getByTestId('wave-image-media')).toBeInTheDocument();
    expect(screen.getByTestId('drop-media')).toBeInTheDocument();
  });

  it('uses MediaDisplay when disabled', () => {
    render(
      <WaveDropPartContentMedias activePart={basePart} disableMediaInteraction />
    );
    expect(screen.getAllByTestId('media-display')).toHaveLength(2);
  });
});
