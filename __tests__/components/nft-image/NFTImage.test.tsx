import { render, screen } from '@testing-library/react';
import React from 'react';
import NFTImage from '../../../components/nft-image/NFTImage';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ alt, priority, ...props }: any) {
    return <img alt={alt} {...props} />;
  };
});

// Mock all renderer components
jest.mock('../../../components/nft-image/renderers/NFTImageRenderer', () => {
  return function MockNFTImageRenderer(props: any) {
    return (
      <div data-testid="nft-image-renderer">
        <img role="img" alt={props.nft.name} src={props.nft.image} />
        {props.balance > 0 && <span>SEIZED{!props.showOwned ? ` x${props.balance}` : ""}</span>}
        {props.showUnseized && props.balance === 0 && <span>UNSEIZED</span>}
        {props.showUnseized && props.balance === -1 && <span>...</span>}
      </div>
    );
  };
});

jest.mock('../../../components/nft-image/renderers/NFTVideoRenderer', () => {
  return function MockNFTVideoRenderer(props: any) {
    return (
      <div data-testid="nft-video-renderer">
        <video src={props.nft.animation} />
        {props.balance > 0 && <span>SEIZED{!props.showOwned ? ` x${props.balance}` : ""}</span>}
        {props.showUnseized && props.balance === 0 && <span>UNSEIZED</span>}
        {props.showUnseized && props.balance === -1 && <span>...</span>}
      </div>
    );
  };
});

jest.mock('../../../components/nft-image/renderers/NFTHTMLRenderer', () => {
  return function MockNFTHTMLRenderer(props: any) {
    return (
      <div data-testid="nft-html-renderer">
        <iframe src={props.nft.animation} />
        {props.balance > 0 && <span>SEIZED{!props.showOwned ? ` x${props.balance}` : ""}</span>}
        {props.showUnseized && props.balance === 0 && <span>UNSEIZED</span>}
        {props.showUnseized && props.balance === -1 && <span>...</span>}
      </div>
    );
  };
});

jest.mock('../../../components/nft-image/renderers/NFTModelRenderer', () => {
  return function MockNFTModelRenderer(props: any) {
    return (
      <div data-testid="nft-model">
        3D Model
        {props.balance > 0 && <span>SEIZED{!props.showOwned ? ` x${props.balance}` : ""}</span>}
        {props.showUnseized && props.balance === 0 && <span>UNSEIZED</span>}
        {props.showUnseized && props.balance === -1 && <span>...</span>}
      </div>
    );
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


  it('renders HTML animation when conditions are met', () => {
    render(
      <NFTImage
        {...defaultProps}
        nft={mockNFTWithMetadata}
        animation={true}
      />
    );
    
    // Should render HTML renderer for HTML animation
    expect(screen.getByTestId('nft-html-renderer')).toBeInTheDocument();
  });

  it('renders GLB animation using NFTModelRenderer', () => {
    const nftWithGLB = {
      ...mockNFT,
      animation: 'https://example.com/model.glb',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/model.glb',
        animation_details: {
          format: 'GLB',
        },
      },
    };
    render(
      <NFTImage {...defaultProps} nft={nftWithGLB} animation={true} />
    );
    expect(screen.getByTestId('nft-model')).toBeInTheDocument();
  });

  it('renders GLB model with balance information correctly', () => {
    const nftWithGLB = {
      ...mockNFT,
      animation: 'https://example.com/model.glb',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/model.glb',
        animation_details: {
          format: 'GLB',
        },
      },
    };
    
    // Test with balance > 0 and showOwned = false (should show quantity)
    const { rerender } = render(
      <NFTImage {...defaultProps} nft={nftWithGLB} animation={true} balance={3} showOwned={false} />
    );
    expect(screen.getByTestId('nft-model')).toBeInTheDocument();
    expect(screen.getByText('SEIZED x3')).toBeInTheDocument();
    
    // Test with balance > 0 and showOwned = true (should not show quantity)
    rerender(
      <NFTImage {...defaultProps} nft={nftWithGLB} animation={true} balance={3} showOwned={true} />
    );
    expect(screen.getByText('SEIZED')).toBeInTheDocument();
    expect(screen.queryByText('SEIZED x3')).not.toBeInTheDocument();
    
    // Test with balance = 0 and showUnseized = true
    rerender(
      <NFTImage {...defaultProps} nft={nftWithGLB} animation={true} balance={0} showUnseized={true} />
    );
    expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
    
    // Test loading state with balance = -1
    rerender(
      <NFTImage {...defaultProps} nft={nftWithGLB} animation={true} balance={-1} showUnseized={true} />
    );
    expect(screen.getByText('...')).toBeInTheDocument();
  });







});

describe('Media Type Detection and Renderer Selection', () => {
  const defaultProps = {
    nft: mockNFT,
    animation: false,
    height: 300 as const,
    balance: 1,
    showUnseized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders NFTImageRenderer when animation is false', () => {
    render(<NFTImage {...defaultProps} animation={false} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('nft-video-renderer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nft-html-renderer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nft-model')).not.toBeInTheDocument();
  });

  it('renders NFTImageRenderer when no animation property exists', () => {
    const nftWithoutAnimation = { ...mockNFT, animation: null };
    render(<NFTImage {...defaultProps} nft={nftWithoutAnimation} animation={true} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('renders NFTVideoRenderer for MP4 animations', () => {
    const nftWithMP4 = {
      ...mockNFT,
      animation: 'https://example.com/video.mp4',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/video.mp4',
        animation_details: { format: 'MP4' },
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithMP4} animation={true} />);
    expect(screen.getByTestId('nft-video-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('nft-image-renderer')).not.toBeInTheDocument();
  });

  it('renders NFTVideoRenderer for MOV animations', () => {
    const nftWithMOV = {
      ...mockNFT,
      animation: 'https://example.com/video.mov',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/video.mov',
        animation_details: { format: 'MOV' },
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithMOV} animation={true} />);
    expect(screen.getByTestId('nft-video-renderer')).toBeInTheDocument();
  });

  it('renders NFTHTMLRenderer for HTML animations', () => {
    const nftWithHTML = {
      ...mockNFT,
      animation: 'https://example.com/interactive.html',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/interactive.html',
        animation_details: { format: 'HTML' },
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithHTML} animation={true} />);
    expect(screen.getByTestId('nft-html-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('nft-image-renderer')).not.toBeInTheDocument();
  });

  it('renders NFTModelRenderer for GLB animations', () => {
    const nftWithGLB = {
      ...mockNFT,
      animation: 'https://example.com/model.glb',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/model.glb',
        animation_details: { format: 'GLB' },
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithGLB} animation={true} />);
    expect(screen.getByTestId('nft-model')).toBeInTheDocument();
    expect(screen.queryByTestId('nft-image-renderer')).not.toBeInTheDocument();
  });

  it('falls back to NFTImageRenderer for unknown animation formats', () => {
    const nftWithUnknownFormat = {
      ...mockNFT,
      animation: 'https://example.com/unknown.xyz',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/unknown.xyz',
        animation_details: { format: 'XYZ' },
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithUnknownFormat} animation={true} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('nft-video-renderer')).not.toBeInTheDocument();
  });

  it('falls back to NFTImageRenderer when animation_details are missing', () => {
    const nftWithoutDetails = {
      ...mockNFT,
      animation: 'https://example.com/something.mp4',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/something.mp4',
      },
    };
    render(<NFTImage {...defaultProps} nft={nftWithoutDetails} animation={true} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('handles case-insensitive format detection', () => {
    const nftWithUppercaseFormat = {
      ...mockNFT,
      animation: 'https://example.com/video.MP4',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/video.MP4',
        animation_details: { format: 'MP4' },
      },
    };
    
    const { rerender } = render(<NFTImage {...defaultProps} nft={nftWithUppercaseFormat} animation={true} />);
    expect(screen.getByTestId('nft-video-renderer')).toBeInTheDocument();

    const nftWithLowercaseFormat = {
      ...mockNFT,
      animation: 'https://example.com/video.mp4',
      metadata: {
        image: 'https://example.com/image.png',
        animation: 'https://example.com/video.mp4',
        animation_details: { format: 'mp4' },
      },
    };
    rerender(<NFTImage {...defaultProps} nft={nftWithLowercaseFormat} animation={true} />);
    expect(screen.getByTestId('nft-video-renderer')).toBeInTheDocument();
  });
});

describe('NFTImage Error Handling and Edge Cases', () => {
  const defaultProps = {
    nft: mockNFT,
    animation: false,
    height: 300 as const,
    balance: 1,
    showUnseized: false,
  };

  it('handles NFT with missing required properties gracefully', () => {
    const minimalNFT = { id: 1, name: 'Minimal' } as any;
    
    expect(() => {
      render(<NFTImage {...defaultProps} nft={minimalNFT} />);
    }).not.toThrow();

    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('handles null metadata gracefully', () => {
    const nftNullMetadata = {
      ...mockNFT,
      metadata: null,
    } as any;
    
    expect(() => {
      render(<NFTImage {...defaultProps} nft={nftNullMetadata} animation={true} />);
    }).not.toThrow();

    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('handles undefined animation_details gracefully', () => {
    const nftUndefinedDetails = {
      ...mockNFT,
      animation: 'test.mp4',
      metadata: {
        image: 'test.png',
        animation_details: undefined,
      },
    } as any;
    
    expect(() => {
      render(<NFTImage {...defaultProps} nft={nftUndefinedDetails} animation={true} />);
    }).not.toThrow();

    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('passes all required props to renderers', () => {
    render(<NFTImage 
      {...defaultProps} 
      height={650}
      balance={5}
      showOwned={true}
      showUnseized={true}
      transparentBG={true}
      id="custom-id"
      showOriginal={true}
      showThumbnail={true}
    />);
    
    const renderer = screen.getByTestId('nft-image-renderer');
    expect(renderer).toBeInTheDocument();
  });

  it('handles NFTLite vs BaseNFT union types correctly', () => {
    // Test with a basic NFTLite structure
    const nftLite = {
      id: 1,
      name: 'Test NFT Lite',
      image: 'https://example.com/image.png',
      thumbnail: 'https://example.com/thumb.png',
    } as any;
    
    expect(() => {
      render(<NFTImage {...defaultProps} nft={nftLite} />);
    }).not.toThrow();

    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('validates height prop correctly', () => {
    const { rerender } = render(<NFTImage {...defaultProps} height={300} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();

    rerender(<NFTImage {...defaultProps} height={650} />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();

    rerender(<NFTImage {...defaultProps} height="full" />);
    expect(screen.getByTestId('nft-image-renderer')).toBeInTheDocument();
  });

  it('handles balance edge cases correctly', () => {
    // Zero balance
    const { rerender } = render(<NFTImage {...defaultProps} balance={0} showUnseized={true} />);
    expect(screen.getByText('UNSEIZED')).toBeInTheDocument();

    // Negative balance (loading state)
    rerender(<NFTImage {...defaultProps} balance={-1} showUnseized={true} />);
    expect(screen.getByText('...')).toBeInTheDocument();

    // Large balance
    rerender(<NFTImage {...defaultProps} balance={999999} />);
    expect(screen.getByText('SEIZED x999999')).toBeInTheDocument();
  });

  it('handles showOwned prop correctly', () => {
    // When showOwned is true, should show just "SEIZED" without quantity
    const { rerender } = render(<NFTImage {...defaultProps} balance={5} showOwned={true} />);
    expect(screen.getByText('SEIZED')).toBeInTheDocument();
    expect(screen.queryByText('SEIZED x5')).not.toBeInTheDocument();

    // When showOwned is false or undefined, should show quantity
    rerender(<NFTImage {...defaultProps} balance={5} showOwned={false} />);
    expect(screen.getByText('SEIZED x5')).toBeInTheDocument();
    
    rerender(<NFTImage {...defaultProps} balance={3} />);
    expect(screen.getByText('SEIZED x3')).toBeInTheDocument();
  });
});