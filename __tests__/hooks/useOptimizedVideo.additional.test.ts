import { renderHook, waitFor } from '@testing-library/react';
import { useOptimizedVideo } from '@/hooks/useOptimizedVideo';
import { isVideoUrl, getVideoConversions, checkVideoAvailability } from '@/helpers/video.helpers';

jest.mock('@/helpers/video.helpers');
const mockIsVideoUrl = isVideoUrl as jest.Mock;
const mockGetConversions = getVideoConversions as jest.Mock;
const mockCheckAvail = checkVideoAvailability as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe('useOptimizedVideo extra cases', () => {
  beforeEach(() => {
    mockIsVideoUrl.mockReturnValue(true);
    mockGetConversions.mockReturnValue({ HLS: 'hls.m3u8', MP4_1080P: '1080.mp4', MP4_720P: '720.mp4' });
  });

  it('uses 1080p mp4 when hls not available', async () => {
    mockCheckAvail.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useOptimizedVideo('video.mp4'));
    await waitFor(() => result.current.playableUrl === '1080.mp4');
    await waitFor(() => result.current.isOptimized === true);
    expect(result.current.isHls).toBe(false);
  });

  it('falls back to 720p mp4 when 1080 not available', async () => {
    mockCheckAvail
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const { result } = renderHook(() => useOptimizedVideo('video.mp4'));
    await waitFor(() => result.current.playableUrl === '720.mp4');
    await waitFor(() => result.current.isOptimized === true);
    expect(result.current.isHls).toBe(false);
  });
});
