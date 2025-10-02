import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DropListItemContentMediaVideo from '@/components/drops/view/item/content/media/DropListItemContentMediaVideo';

jest.mock('@/hooks/useDeviceInfo', () => () => ({ isApp: false }));
jest.mock('@/hooks/useInView', () => ({ useInView: jest.fn() }));
jest.mock('@/hooks/useOptimizedVideo', () => ({ useOptimizedVideo: jest.fn() }));

const mockUseInView = require('@/hooks/useInView').useInView as jest.Mock;
const mockUseOptimizedVideo = require('@/hooks/useOptimizedVideo').useOptimizedVideo as jest.Mock;

describe('DropListItemContentMediaVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders video when in view', () => {
    const ref = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, true]);
    mockUseOptimizedVideo.mockReturnValue({ playableUrl: 'foo.mp4', isHls: false });

    // Mock HTMLVideoElement.play to return a promise
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(screen.getByText('Your browser does not support the video tag.')).toBeInTheDocument();
    const vid = document.querySelector('video') as HTMLVideoElement;
    expect(vid).toBeTruthy();
    expect(vid.autoplay).toBe(false); // Component uses useEffect for controlled playback
  });

  it('renders video even when not in view (but paused)', () => {
    const ref = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    mockUseInView.mockReturnValue([ref, false]);
    mockUseOptimizedVideo.mockReturnValue({ playableUrl: 'foo.mp4', isHls: false });

    render(<DropListItemContentMediaVideo src="foo.mp4" />);
    expect(document.querySelector('video')).toBeTruthy(); // Video is still rendered, just paused
  });
});
