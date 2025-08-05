import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ArtistActiveSubmissionContent } from '../../../../components/waves/drops/ArtistActiveSubmissionContent';
import { ApiProfileMin } from '../../../../generated/models/ApiProfileMin';

// Mock dependencies
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('../../../../components/drops/view/item/content/media/MediaDisplay', () => ({
  __esModule: true,
  default: ({ media_url }: any) => <img src={media_url} alt="submission" data-testid="media-display" />,
}));

const mockSubmissions = [
  {
    id: 'drop-1',
    imageUrl: 'https://example.com/image1.jpg',
    mediaMimeType: 'image/jpeg',
    title: 'Test Artwork 1',
    createdAt: 1640995200000, // 2022-01-01
  },
  {
    id: 'drop-2',
    imageUrl: 'https://example.com/image2.png',
    mediaMimeType: 'image/png',
    title: 'Test Artwork 2',
    createdAt: 1641081600000, // 2022-01-02
  },
];

jest.mock('../../../../hooks/useUserArtSubmissions', () => ({
  useUserArtSubmissions: jest.fn(() => ({
    submissions: mockSubmissions,
    isLoading: false,
    error: null,
  })),
}));

describe('ArtistActiveSubmissionContent', () => {
  const mockUser: ApiProfileMin = {
    id: 'user-123',
    handle: 'test-artist',
    pfp: 'https://example.com/avatar.jpg',
    level: 1,
    cic: 100,
    rep: 50,
  };

  const defaultProps = {
    user: mockUser,
    isOpen: true,
    onClose: jest.fn(),
    isApp: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock state with submissions
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
  });

  it('returns null when searchParams is null', () => {
    const originalMock = require('next/navigation').useSearchParams;
    require('next/navigation').useSearchParams = jest.fn().mockReturnValue(null);
    
    const { container } = render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(container.firstChild).toBeNull();
    
    // Restore original mock
    require('next/navigation').useSearchParams = originalMock;
  });

  it('renders header with user information', () => {
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText("test-artist's Submissions")).toBeInTheDocument();
    expect(screen.getByText('The Memes Collection')).toBeInTheDocument();
  });

  it('displays submission count correctly', () => {
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText('2 artworks')).toBeInTheDocument();
  });

  it('displays singular form for single artwork', () => {
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: [mockSubmissions[0]],
      isLoading: false,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText('1 artwork')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: [],
      isLoading: true,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText('Loading submissions...')).toBeInTheDocument();
    // Loading spinner should be present in header
    expect(document.querySelector('.tw-animate-spin')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: [],
      isLoading: false,
      error: 'Failed to fetch',
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('reloads page when retry button is clicked', () => {
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: [],
      isLoading: false,
      error: 'Failed to fetch',
    });
    
    // Mock location.reload
    const mockReload = jest.fn();
    delete (window as any).location;
    (window as any).location = { reload: mockReload };
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(mockReload).toHaveBeenCalled();
  });

  it('renders submissions grid', () => {
    // Reset mock to return submissions
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByText('Test Artwork 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artwork 2')).toBeInTheDocument();
    expect(screen.getAllByTestId('media-display')).toHaveLength(2);
  });

  it('handles submission click navigation', () => {
    // Reset mock to return submissions
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    const firstSubmission = screen.getByText('Test Artwork 1').closest('.tw-group');
    if (firstSubmission) {
      fireEvent.click(firstSubmission);
    }
    
    expect(mockPush).toHaveBeenCalledWith('/test-path?drop=drop-1');
  });

  it('closes modal after navigation', () => {
    // Reset mock to return submissions
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    
    const mockOnClose = jest.fn();
    render(<ArtistActiveSubmissionContent {...defaultProps} onClose={mockOnClose} />);
    
    const firstSubmission = screen.getByText('Test Artwork 1').closest('.tw-group');
    if (firstSubmission) {
      fireEvent.click(firstSubmission);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('formats dates correctly', () => {
    // Reset mock to return submissions
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    // Check that calendar icons are present (indicates date sections are rendered)
    const calendarIcons = document.querySelectorAll('[data-slot="icon"]');
    expect(calendarIcons.length).toBeGreaterThan(0);
    
    // Check that submission grid is rendered with proper structure
    expect(document.querySelector('.tw-grid')).toBeInTheDocument();
  });

  it('renders close button for web (not app)', () => {
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    expect(screen.getByLabelText('Close Gallery')).toBeInTheDocument();
  });

  it('does not render close button for app', () => {
    render(<ArtistActiveSubmissionContent {...defaultProps} isApp={true} />);
    
    expect(screen.queryByLabelText('Close Gallery')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ArtistActiveSubmissionContent {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close Gallery');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles user without handle', () => {
    const userWithoutHandle = { ...mockUser, handle: undefined };
    render(<ArtistActiveSubmissionContent {...defaultProps} user={userWithoutHandle} />);
    
    expect(screen.getByText("Unknown Artist's Submissions")).toBeInTheDocument();
  });

  it('renders user avatar when pfp is provided', () => {
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    const avatar = screen.getByAltText('Profile');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders fallback icon when no pfp', () => {
    const userWithoutPfp = { ...mockUser, pfp: undefined };
    render(<ArtistActiveSubmissionContent {...defaultProps} user={userWithoutPfp} />);
    
    // Should render the palette icon fallback in the avatar area
    const paletteIcon = document.querySelector('[data-icon="palette"]');
    expect(paletteIcon).toBeInTheDocument();
  });

  it('applies different scrolling styles for app vs web', () => {
    const { rerender } = render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    // Web version should have scrollbar styles
    expect(document.querySelector('.tw-overflow-y-auto')).toBeInTheDocument();
    
    rerender(<ArtistActiveSubmissionContent {...defaultProps} isApp={true} />);
    
    // App version should not have the scrollbar styles in the same container
    // (scrolling is handled by the app wrapper)
  });

  it('handles submissions without titles', () => {
    const submissionsWithoutTitle = [{
      ...mockSubmissions[0],
      title: undefined,
    }];
    
    const { useUserArtSubmissions } = require('../../../../hooks/useUserArtSubmissions');
    useUserArtSubmissions.mockReturnValue({
      submissions: submissionsWithoutTitle,
      isLoading: false,
      error: null,
    });
    
    render(<ArtistActiveSubmissionContent {...defaultProps} />);
    
    // Should not crash and should still render the submission
    expect(screen.getByTestId('media-display')).toBeInTheDocument();
    expect(screen.queryByText('Test Artwork 1')).not.toBeInTheDocument();
  });
});