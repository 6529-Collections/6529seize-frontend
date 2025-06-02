import { validateFile, testVideoCompatibility } from '../../../../../../components/waves/memes/file-upload/utils/fileValidation';

// Mock MediaError constants
const MediaErrorMock = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

// Define MediaError globally for tests
(global as any).MediaError = MediaErrorMock;

// Mock constants
jest.mock('../../../../../../components/waves/memes/file-upload/utils/constants', () => ({
  FILE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB
  COMPATIBILITY_CHECK_TIMEOUT_MS: 5000,
}));

// Mock format helpers
jest.mock('../../../../../../components/waves/memes/file-upload/utils/formatHelpers', () => ({
  getFileExtension: jest.fn((file) => 'mp4'),
  getBrowserSpecificMessage: jest.fn(() => 'Format not supported in this browser'),
}));

describe('fileValidation', () => {
  describe('validateFile', () => {
    it('should reject null file', () => {
      const result = validateFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file selected.');
    });

    it('should accept valid PNG file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid video file', () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not supported');
    });

    it('should reject file exceeding size limit', () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('testVideoCompatibility', () => {
    beforeEach(() => {
      // Mock document.createElement and URL methods
      global.document.createElement = jest.fn(() => ({
        canPlayType: jest.fn(() => 'probably'),
        load: jest.fn(),
        removeAttribute: jest.fn(),
        onloadedmetadata: null,
        onerror: null,
        videoWidth: 1920,
        videoHeight: 1080,
      })) as any;
      
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('should return canPlay true for non-video files', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = await testVideoCompatibility(file);
      expect(result.canPlay).toBe(true);
      expect(result.tested).toBe(false);
    });

    it('should handle video compatibility testing', async () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      
      // Mock successful video loading
      const mockVideo = {
        canPlayType: jest.fn(() => 'probably'),
        load: jest.fn(),
        removeAttribute: jest.fn(),
        videoWidth: 1920,
        videoHeight: 1080,
        onloadedmetadata: null,
        onerror: null,
      };
      
      global.document.createElement = jest.fn(() => mockVideo) as any;
      
      // Simulate successful loading
      setTimeout(() => {
        if (mockVideo.onloadedmetadata) {
          mockVideo.onloadedmetadata();
        }
      }, 0);
      
      const result = await testVideoCompatibility(file);
      expect(result.tested).toBe(true);
    });

    it('handles error event', async () => {
      const file = new File(['x'], 'vid.mp4', { type: 'video/mp4' });
      const mockVideo: any = {
        canPlayType: jest.fn(() => 'maybe'),
        load: jest.fn(),
        removeAttribute: jest.fn(),
        error: { code: MediaError.MEDIA_ERR_NETWORK },
      };
      global.document.createElement = jest.fn(() => mockVideo) as any;
      const promise = testVideoCompatibility(file);
      mockVideo.onerror();
      jest.runAllTimers();
      const res = await promise;
      expect(res.canPlay).toBe(false);
      expect(res.tested).toBe(true);
    });

    it('returns error when thrown', async () => {
      global.document.createElement = jest.fn(() => {
        throw new Error('boom');
      }) as any;
      const res = await testVideoCompatibility(new File(['x'], 'v.mp4', { type: 'video/mp4' }));
      expect(res.canPlay).toBe(false);
      expect(res.technicalReason).toBe('boom');
    });
  });
});