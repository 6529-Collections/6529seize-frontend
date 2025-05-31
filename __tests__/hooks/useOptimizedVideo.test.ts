import { renderHook, waitFor } from '@testing-library/react';
import { useOptimizedVideo } from '../../hooks/useOptimizedVideo';
import { isVideoUrl, getVideoConversions, checkVideoAvailability } from '../../helpers/video.helpers';

jest.mock('../../helpers/video.helpers');

const mockIsVideoUrl = isVideoUrl as jest.Mock;
const mockGetConversions = getVideoConversions as jest.Mock;
const mockCheckAvailability = checkVideoAvailability as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe('useOptimizedVideo', () => {
  it('returns original url for non video', () => {
    mockIsVideoUrl.mockReturnValue(false);
    const { result } = renderHook(() => useOptimizedVideo('file.txt'));
    expect(result.current.playableUrl).toBe('file.txt');
    expect(result.current.isOptimized).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('picks optimized hls url when available', async () => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockReturnValue({ HLS: 'hls.m3u8', MP4_1080P: '1080.mp4', MP4_720P: '720.mp4' });
    mockCheckAvailability.mockResolvedValue(true);

    const { result } = renderHook(() => useOptimizedVideo('video.mp4'));
    await waitFor(() => expect(result.current.isOptimized).toBe(true));
    expect(result.current.playableUrl).toBe('hls.m3u8');
    expect(result.current.isHls).toBe(true);
  });
});
