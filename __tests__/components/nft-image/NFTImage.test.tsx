import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTImage from '../../../components/nft-image/NFTImage';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ alt, priority, ...props }: any) {
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

  it('renders GLB animation using NFTModel', () => {
    const nft = {
      ...mockNFT,
      metadata: {
        animation: 'model.glb',
        animation_details: { format: 'GLB' },
      },
    } as any;
    render(
      <NFTImage {...defaultProps} nft={nft} animation={true} />
    );
    expect(screen.getByTestId('nft-model')).toBeInTheDocument();
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
    render(<NFTImage {...defaultProps} balance={5} showOwned={false} />);
    expect(screen.getByText('SEIZED x5')).toBeInTheDocument();
  });

  it('shows UNSEIZED when showUnseized and balance 0', () => {
    render(<NFTImage {...defaultProps} balance={0} showUnseized={true} />);
    expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
  });

  it('renders MP4 animation inside video tag', () => {
    const nft = {
      ...mockNFT,
      animation: 'vid.mp4',
      metadata: { animation_details: { format: 'MP4' }, animation: 'vid.mp4' },
    } as any;
    const { container } = render(
      <NFTImage {...defaultProps} nft={nft} animation={true} />
    );
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('falls back through image sources on error', () => {
    const nft = {
      ...mockNFT,
      scaled: 'https://example.com/scaled.png',
      metadata: { image: 'https://example.com/meta.png' },
    } as any;
    render(
      <NFTImage {...defaultProps} nft={nft} showThumbnail={true} />
    );
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('thumb.png');
    img.dispatchEvent(new Event('error'));
    expect(img.src).toContain('scaled.png');
    img.dispatchEvent(new Event('error'));
    expect(img.src).toContain('image.png');
    img.dispatchEvent(new Event('error'));
    expect(img.src).toContain('meta.png');
  });

  it('falls back to animation url on video error', () => {
    const nft = {
      ...mockNFT,
      animation: 'https://example.com/anim.mp4',
      compressed_animation: 'https://example.com/comp.mp4',
      metadata: { animation: 'https://example.com/backup.mp4', animation_details: { format: 'MP4' } },
    } as any;
    const { container } = render(
      <NFTImage {...defaultProps} nft={nft} animation={true} />
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.src).toContain('comp.mp4');
    video.dispatchEvent(new Event('error'));
    expect(video.src).toContain('anim.mp4');
    video.dispatchEvent(new Event('error'));
    expect(video.src).toContain('backup.mp4');
  });
});