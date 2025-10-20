import React from 'react';
import { render, screen } from '@testing-library/react';
import LatestDropSection from '@/components/home/LatestDropSection';
import { NFTWithMemesExtendedData } from '@/entities/INFT';

jest.mock('@/components/home/FeaturedNFTImageColumn', () => ({
  __esModule: true,
  default: ({ featuredNft }: any) => (
    <div data-testid='featured-nft-image-column'>image {featuredNft.name}</div>
  ),
}));

jest.mock('@/components/home/FeaturedNFTDetailsColumn', () => ({
  __esModule: true,
  default: ({ featuredNft, isMemeMintingActive }: any) => (
    <div data-testid='featured-nft-details-column'>details {featuredNft.name} {String(isMemeMintingActive)}</div>
  ),
}));

const baseNft: NFTWithMemesExtendedData = {
  id: 1,
  name: 'Test Meme',
  contract: '0x123',
  collection: 'The Memes',
  season: 1,
  meme_name: 'Test Meme',
  artist: 'Artist',
  mint_date: '2024-01-01T00:00:00Z',
  metadata: {
    image_details: {
      format: 'png',
      width: 1000,
      height: 1000,
    },
  },
  animation: null,
} as NFTWithMemesExtendedData;

describe('LatestDropSection', () => {
  it('renders the layout container and row', () => {
    const { container } = render(
      <LatestDropSection featuredNft={baseNft} isMemeMintingActive={false} />
    );

    const bootstrapContainer = container.querySelector('.container');
    expect(bootstrapContainer).toBeInTheDocument();
    expect(bootstrapContainer).toHaveClass('tw-pt-2.5');
    expect(bootstrapContainer?.querySelectorAll('.row')).toHaveLength(1);
  });

  it('passes featured nft to child columns', () => {
    render(
      <LatestDropSection featuredNft={baseNft} isMemeMintingActive={true} />
    );

    expect(screen.getByTestId('featured-nft-image-column')).toHaveTextContent(
      'image Test Meme'
    );
    expect(screen.getByTestId('featured-nft-details-column')).toHaveTextContent(
      'details Test Meme true'
    );
  });

  it('handles different nft props', () => {
    const other = { ...baseNft, name: 'Other Meme' };
    render(<LatestDropSection featuredNft={other} isMemeMintingActive={false} />);

    expect(screen.getByTestId('featured-nft-image-column')).toHaveTextContent(
      'image Other Meme'
    );
    expect(screen.getByTestId('featured-nft-details-column')).toHaveTextContent(
      'details Other Meme false'
    );
  });
});
