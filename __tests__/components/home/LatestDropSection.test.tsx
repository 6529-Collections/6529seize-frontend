import React from 'react';
import { render, screen } from '@testing-library/react';
import LatestDropSection from '@/components/home/LatestDropSection';
import { NFTWithMemesExtendedData } from '@/entities/INFT';

// Mock child components since we're only testing the parent structure
jest.mock('@/components/home/FeaturedNFTImageColumn', () => {
  const MockFeaturedNFTImageColumn = ({ featuredNft }: any) => (
    <div data-testid="featured-nft-image-column">
      Featured Image Column for {featuredNft.name}
    </div>
  );
  MockFeaturedNFTImageColumn.displayName = 'FeaturedNFTImageColumn';
  return MockFeaturedNFTImageColumn;
});

jest.mock('@/components/home/FeaturedNFTDetailsColumn', () => {
  const MockFeaturedNFTDetailsColumn = ({ featuredNft }: any) => (
    <div data-testid="featured-nft-details-column">
      Featured Details Column for {featuredNft.name}
    </div>
  );
  MockFeaturedNFTDetailsColumn.displayName = 'FeaturedNFTDetailsColumn';
  return MockFeaturedNFTDetailsColumn;
});

// Mock data
const mockNft: NFTWithMemesExtendedData = {
  id: 123,
  name: 'Test Meme',
  contract: '0x1234567890123456789012345678901234567890',
  collection: 'The Memes',
  season: 1,
  meme_name: 'Test Meme Name',
  artist: 'Test Artist',
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Structure', () => {
    it('should render the latest drop section with correct title', () => {
      render(<LatestDropSection featuredNft={mockNft} />);

      expect(screen.getByText('Latest')).toBeInTheDocument();
      expect(screen.getByText('Drop')).toBeInTheDocument();
    });

    it('should render the title as an h1 element with correct structure', () => {
      render(<LatestDropSection featuredNft={mockNft} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Latest Drop');
      
      // Check that "Latest" has the font-lightest class
      const latestSpan = screen.getByText('Latest');
      expect(latestSpan).toHaveClass('font-lightest');
    });

    it('should render FeaturedNFTImageColumn component', () => {
      render(<LatestDropSection featuredNft={mockNft} />);

      expect(screen.getByTestId('featured-nft-image-column')).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Image Column for ${mockNft.name}`)
      ).toBeInTheDocument();
    });

    it('should render FeaturedNFTDetailsColumn component', () => {
      render(<LatestDropSection featuredNft={mockNft} />);

      expect(screen.getByTestId('featured-nft-details-column')).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Details Column for ${mockNft.name}`)
      ).toBeInTheDocument();
    });

    it('should pass featuredNft prop to both child components', () => {
      render(<LatestDropSection featuredNft={mockNft} />);

      // Both child components should receive the featuredNft and render content based on it
      expect(
        screen.getByText(`Featured Image Column for ${mockNft.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Details Column for ${mockNft.name}`)
      ).toBeInTheDocument();
    });

    it('should use Bootstrap layout components correctly', () => {
      const { container } = render(<LatestDropSection featuredNft={mockNft} />);

      // Check for container class
      expect(container.querySelector('.container.pt-4')).toBeInTheDocument();
      
      // Check for row classes
      const rows = container.querySelectorAll('.row');
      expect(rows).toHaveLength(2); // One for title, one for content
    });
  });

  describe('Props Handling', () => {
    it('should handle different featuredNft prop values', () => {
      const differentNft = {
        ...mockNft,
        id: 456,
        name: 'Different Meme'
      };

      render(<LatestDropSection featuredNft={differentNft} />);

      expect(
        screen.getByText(`Featured Image Column for ${differentNft.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Details Column for ${differentNft.name}`)
      ).toBeInTheDocument();
    });

    it('should render correctly with minimal NFT data', () => {
      const minimalNft = {
        ...mockNft,
        name: 'Minimal Meme',
        // Testing that it works even with minimal required properties
      };

      render(<LatestDropSection featuredNft={minimalNft} />);

      expect(screen.getByText('Latest')).toBeInTheDocument();
      expect(screen.getByText('Drop')).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Image Column for ${minimalNft.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Featured Details Column for ${minimalNft.name}`)
      ).toBeInTheDocument();
    });
  });
});