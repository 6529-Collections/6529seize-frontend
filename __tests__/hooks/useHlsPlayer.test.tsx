import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

// Force the dynamic import of `hls.js` to return a minimal unsupported
// implementation so the hook immediately falls back to the provided source.
jest.mock('hls.js', () => {
  class MockHls {
    static isSupported() {
      return false;
    }
    // no-op methods used by the hook
    on() {}
    loadSource() {}
    attachMedia() {}
    stopLoad() {}
    detachMedia() {}
    destroy() {}
  }
  return { __esModule: true, default: MockHls };
});

// Mock HTMLVideoElement.play to return a Promise
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLVideoElement.prototype, 'load', { writable: true, value: jest.fn() });
Object.defineProperty(HTMLVideoElement.prototype, 'pause', { writable: true, value: jest.fn() });

function TestComponent(props: any) {
  const { videoRef, isLoading } = useHlsPlayer(props);
  return <video data-testid="vid" ref={videoRef} data-loading={isLoading} />;
}

describe('useHlsPlayer', () => {
  it('handles non-HLS video sources correctly', () => {
    const { getByTestId } = render(<TestComponent src="video.mp4" isHls={false} />);
    const video = getByTestId('vid') as HTMLVideoElement;
    expect(video.src).toContain('video.mp4');
    expect(video.getAttribute('data-loading')).toBe('false');
  });

  it('sets src correctly for HLS when fallback is provided and HLS fails', async () => {
    const { getByTestId } = render(
      <TestComponent src="video.m3u8" isHls={true} fallbackSrc="fallback.mp4" />
    );
    const video = getByTestId('vid') as HTMLVideoElement;
    expect(video.getAttribute('data-loading')).toBe('true');
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(video.getAttribute('data-loading')).toBe('false');
    });
    expect(video.src).toContain('fallback.mp4');
  });

  it('handles autoPlay prop correctly for non-HLS videos', () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} autoPlay={true} />
    );
    const video = getByTestId('vid') as HTMLVideoElement;
    expect(video.src).toContain('video.mp4');
    expect(video.getAttribute('data-loading')).toBe('false');
  });

  it('cleans up video on unmount', () => {
    const { getByTestId, unmount } = render(<TestComponent src="v.mp4" isHls={false} />);
    const video = getByTestId('vid') as HTMLVideoElement;
    const pauseSpy = jest.spyOn(video, 'pause');
    unmount();
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.src).toBe('');
  });

  it('updates src when changed', () => {
    const { getByTestId, rerender } = render(<TestComponent src="a.mp4" isHls={false} />);
    rerender(<TestComponent src="b.mp4" isHls={false} />);
    const video = getByTestId('vid') as HTMLVideoElement;
    expect(video.src).toContain('b.mp4');
  });
});
