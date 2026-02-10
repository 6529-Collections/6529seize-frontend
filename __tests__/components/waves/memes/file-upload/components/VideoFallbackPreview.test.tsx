import React from 'react';
import { render, screen } from '@testing-library/react';
import VideoFallbackPreview from '@/components/waves/memes/file-upload/components/VideoFallbackPreview';

jest.mock('@/components/waves/memes/file-upload/utils/formatHelpers', () => ({
  getFileExtension: jest.fn(() => 'MP4'),
  formatFileSize: jest.fn(() => '2 KB'),
  getBrowserSpecificMessage: jest.fn(() => 'Browser msg')
}));

describe('VideoFallbackPreview', () => {
  const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });

  it('renders file info and message', () => {
    render(<VideoFallbackPreview file={file} />);
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
    expect(screen.getByText('MP4')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    expect(screen.getByText('Browser msg')).toBeInTheDocument();
  });

  it('uses explicit error message when provided', () => {
    render(<VideoFallbackPreview file={file} errorMessage="Oops" />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });
});
