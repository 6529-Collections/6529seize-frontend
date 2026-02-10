import { render, screen } from '@testing-library/react';
import React from 'react';
import RememeImage from '@/components/nft-image/RememeImage';

jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img {...p} /> }));
jest.mock('@/helpers/Helpers', () => ({
  parseIpfsUrl: (url: string) => `parsed-${url}`,
  parseIpfsUrlToGateway: (url: string) => `gateway-${url}`,
}));

describe('RememeImage', () => {
  const nftBase = {
    id: '1',
    contract: '0xabc',
    image: 'ipfs://image.jpg',
    animation: '',
    metadata: {
      name: 'test',
      image: 'ipfs://meta.jpg',
      animation: 'ipfs://anim.mp4',
      animation_details: { format: 'MP4' },
    },
    contract_opensea_data: { imageUrl: 'opensea.jpg' },
    s3_image_thumbnail: 'thumb.jpg',
    s3_image_scaled: 'scaled.jpg',
    s3_image_original: 'orig.jpg',
  } as any;

  it('renders video when mp4 animation requested', () => {
    const nft = { ...nftBase, image: 'file.mp4', animation: 'file.mp4' };
    const { container } = render(<RememeImage nft={nft} animation height={300} />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute('src', expect.stringContaining('parsed-'));
  });

  it('renders still image with first fallback', () => {
    const nft = { ...nftBase };
    render(<RememeImage nft={nft} animation={false} height={300} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'thumb.jpg');
  });
});
