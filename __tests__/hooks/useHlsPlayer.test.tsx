import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';

jest.mock('hls.js', () => {
  return {
    __esModule: true,
    default: class MockHls {
      static Events = { ERROR: 'ERROR', MANIFEST_PARSED: 'MANIFEST_PARSED' };
      static ErrorTypes = { OTHER_ERROR: 'OTHER_ERROR' };
      static ErrorDetails = { MANIFEST_INCOMPATIBLE_CODECS_ERROR: 'ERR' };
      static isSupported() { return true; }
      handlers: Record<string, any> = {};
      on(event: string, cb: any) { this.handlers[event] = cb; }
      loadSource() {
        // trigger fatal error to force fallback
        this.handlers['ERROR']?.({}, { fatal: true, type: 'OTHER_ERROR' });
      }
      attachMedia() {}
      stopLoad() {}
      detachMedia() {}
      destroy() {}
    },
  };
});

Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

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
    expect(video.getAttribute('data-loading')).toBe('true');
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
});
