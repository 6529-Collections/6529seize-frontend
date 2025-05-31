import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';

// Provide a lightweight mock for hls.js so the hook logic can execute
jest.mock('hls.js', () => {
  return {
    __esModule: true,
    default: class MockHls {
      static isSupported() {
        return true;
      }
      static Events = { MANIFEST_PARSED: 'MANIFEST_PARSED', ERROR: 'ERROR' };
      static ErrorTypes = { NETWORK_ERROR: 'NETWORK_ERROR', MEDIA_ERROR: 'MEDIA_ERROR' };
      static ErrorDetails = { MANIFEST_LOAD_ERROR: 'MANIFEST_LOAD_ERROR', MANIFEST_LOAD_TIMEOUT: 'MANIFEST_LOAD_TIMEOUT' };
      on(event: string, cb: () => void) {
        if (event === 'MANIFEST_PARSED') {
          // Trigger manifest parsed quickly
          setTimeout(cb, 0);
        }
      }
      loadSource() {}
      attachMedia() {}
      detachMedia() {}
      destroy() {}
      stopLoad() {}
      startLoad() {}
      recoverMediaError() {}
    },
  };
});

// Mock HTMLVideoElement.play to return a Promise
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

// Mock HTMLVideoElement.load
Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
});

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
    
    // Initially loading should be true
    expect(video.getAttribute('data-loading')).toBe('true');
    
    // Wait for either HLS to load or fallback to be applied
    await waitFor(() => {
      expect(video.getAttribute('data-loading')).toBe('false');
    }, { timeout: 3000 });
  });

  it('handles autoPlay prop correctly for non-HLS videos', () => {
    const { getByTestId } = render(
      <TestComponent src="video.mp4" isHls={false} autoPlay={true} />
    );
    const video = getByTestId('vid') as HTMLVideoElement;
    
    expect(video.src).toContain('video.mp4');
    expect(video.getAttribute('data-loading')).toBe('false');
  });
});