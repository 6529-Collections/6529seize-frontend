import { getVideoConversions, isVideoUrl, checkVideoAvailability } from '@/helpers/video.helpers';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('video helpers', () => {
  it('detects video url', () => {
    expect(isVideoUrl('file.mp4')).toBe(true);
    expect(isVideoUrl('file.txt')).toBe(false);
  });

  it('creates conversion urls', () => {
    const url = 'https://d3lqz0a4bldqgf.cloudfront.net/drops/foo/bar.mp4';
    const result = getVideoConversions(url);
    expect(result).not.toBeNull();
    expect(result!.HLS).toContain('renditions');
  });

  it('checks availability using fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;
    const ok = await checkVideoAvailability('u');
    expect(fetchMock).toHaveBeenCalled();
    expect(ok).toBe(true);
  });
});
