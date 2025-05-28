import { validateFile, testVideoCompatibility } from '../../../../../../components/waves/memes/file-upload/utils/fileValidation';

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
  });
});