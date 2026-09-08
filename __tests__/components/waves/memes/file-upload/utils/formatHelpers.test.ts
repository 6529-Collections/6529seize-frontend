import { getFileExtension, formatFileSize, getBrowserSpecificMessage } from '@/components/waves/memes/file-upload/utils/formatHelpers';

jest.mock('@/components/waves/memes/file-upload/utils/browserDetection', () => ({
  detectBrowser: () => 'Chrome'
}));

describe('formatHelpers', () => {
  it('gets file extension', () => {
    const f = new File([], 'video.mp4');
    expect(getFileExtension(f)).toBe('MP4');
  });

  it('formats bytes', () => {
    expect(formatFileSize(1_000_000)).toBe('1 MB');
    expect(formatFileSize(250_000_000)).toBe('250 MB');
    expect(formatFileSize(262_144_000)).toBe('262.14 MB');
  });

  it('returns browser specific message', () => {
    const f = new File([], 'clip.mov');
    expect(getBrowserSpecificMessage(f)).toMatch('Chrome');
  });
});
