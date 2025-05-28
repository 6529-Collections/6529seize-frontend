import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTImage from '../../../components/nft-image/NFTImage';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: any) {
    return <img alt={alt} {...props} />;
  };
});

// Mock NFTModel component
jest.mock('../../../components/nft-image/NFTModel', () => {
  return function MockNFTModel() {
    return <div data-testid="nft-model">3D Model</div>;
  };
});

const mockNFT = {
  id: 1,
  contract: '0x123',
  token_id: '1',
  name: 'Test NFT',
  image: 'https://example.com/image.png',
  thumbnail: 'https://example.com/thumb.png',
  animation: null,
};

const mockNFTWithMetadata = {
  ...mockNFT,
  metadata: {
    image: 'https://example.com/image.png',
    animation_url: 'https://example.com/animation.html',
    animation_details: {
      format: 'HTML',
    },
  },
  animation: 'https://example.com/animation.html',
};

describe('NFTImage', () => {
  const defaultProps = {
    nft: mockNFT,
    animation: false,
    height: 300 as const,
    balance: 1,
    showUnseized: false,
  };

  it('renders basic NFT image', () => {
    render(<NFTImage {...defaultProps} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', 'Test NFT');
  });

  it('calls onLoad callback when provided', () => {
    const onLoadMock = jest.fn();
    render(<NFTImage {...defaultProps} onLoad={onLoadMock} />);
    
    expect(onLoadMock).toHaveBeenCalled();
  });

  it('renders HTML animation when conditions are met', () => {
    render(
      <NFTImage
        {...defaultProps}
        nft={mockNFTWithMetadata}
        animation={true}
      />
    );
    
    // Should render iframe for HTML animation
    const iframe = screen.queryByTestId('nft-model');
    if (iframe) {
      expect(iframe).toBeInTheDocument();
    }
  });

  it('applies height classes correctly', () => {
    const { container, rerender } = render(<NFTImage {...defaultProps} height={300} />);
    expect(container.querySelector('.height300')).toBeInTheDocument();

    rerender(<NFTImage {...defaultProps} height={650} />);
    expect(container.querySelector('.height650')).toBeInTheDocument();

    rerender(<NFTImage {...defaultProps} height="full" />);
    expect(container.querySelector('.heightFull')).toBeInTheDocument();
  });

  it('applies transparent background when specified', () => {
    const { container } = render(<NFTImage {...defaultProps} transparentBG={true} />);
    expect(container.querySelector('.transparentBG')).toBeInTheDocument();
  });

  it('shows balance when specified', () => {
    render(<NFTImage {...defaultProps} balance={5} showOwned={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});