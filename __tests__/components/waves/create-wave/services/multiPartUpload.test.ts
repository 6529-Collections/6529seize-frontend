import axios from 'axios';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { multiPartUpload } from '../../../../../components/waves/create-wave/services/multiPartUpload';
import { commonApiPost } from '../../../../../services/api/common-api';

// Mock dependencies
jest.mock('axios');
jest.mock('p-limit');
jest.mock('p-retry');
jest.mock('../../../../../services/api/common-api');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;
const mockPLimit = pLimit as jest.MockedFunction<typeof pLimit>;
const mockPRetry = pRetry as jest.MockedFunction<typeof pRetry>;

describe('multiPartUpload', () => {
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  const mockOnProgress = jest.fn();

  const mockStartResponse = {
    upload_id: 'test-upload-id',
    key: 'test-key'
  };

  const mockPartResponse = {
    upload_url: 'https://s3.example.com/upload-url',
    part_no: 1
  };

  const mockCompleteResponse = {
    media_url: 'https://cdn.example.com/final-url'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock pLimit to return a function that just executes the task
    mockPLimit.mockReturnValue((fn: any) => fn());
    
    // Mock pRetry to just execute the function
    mockPRetry.mockImplementation((fn: any) => fn());

    // Setup default successful responses
    mockCommonApiPost
      .mockResolvedValueOnce(mockStartResponse) // Start multipart
      .mockResolvedValueOnce(mockPartResponse) // Get part URL
      .mockResolvedValueOnce(mockCompleteResponse); // Complete multipart

    mockAxios.put.mockResolvedValue({
      headers: { etag: '"test-etag"' },
      status: 200
    });
  });

  describe('File Size Validation', () => {
    it('throws error when file exceeds maximum size', async () => {
      // Create a mock file with large size instead of actual large content
      const largeFile = {
        size: 501 * 1024 * 1024, // 501 MB
        name: 'large.txt',
        type: 'text/plain'
      } as File;
      
      await expect(
        multiPartUpload({
          file: largeFile,
          path: 'drop'
        })
      ).rejects.toThrow('File size exceeds maximum allowed size of 500 MB');
    });

    it('accepts files within size limit', async () => {
      const acceptableFile = new File(['small content'], 'small.txt', { type: 'text/plain' });
      
      const result = await multiPartUpload({
        file: acceptableFile,
        path: 'drop'
      });

      expect(result).toEqual({
        url: 'https://cdn.example.com/final-url',
        mime_type: 'text/plain'
      });
    });
  });

  describe('Multi-part Upload Process', () => {
    it('successfully uploads a file for drop path', async () => {
      const result = await multiPartUpload({
        file: mockFile,
        path: 'drop',
        onProgress: mockOnProgress
      });

      // Verify start upload call
      expect(mockCommonApiPost).toHaveBeenNthCalledWith(1, {
        endpoint: 'drop-media/multipart-upload',
        body: {
          file_name: 'test.txt',
          content_type: 'text/plain'
        }
      });

      // Verify part upload call
      expect(mockCommonApiPost).toHaveBeenNthCalledWith(2, {
        endpoint: 'drop-media/multipart-upload/part',
        body: {
          upload_id: 'test-upload-id',
          key: 'test-key',
          part_no: 1
        }
      });

      // Verify axios PUT call
      expect(mockAxios.put).toHaveBeenCalledWith(
        'https://s3.example.com/upload-url',
        expect.any(Blob),
        {
          headers: { 'Content-Type': 'text/plain' },
          onUploadProgress: expect.any(Function)
        }
      );

      // Verify completion call
      expect(mockCommonApiPost).toHaveBeenNthCalledWith(3, {
        endpoint: 'drop-media/multipart-upload/completion',
        body: {
          upload_id: 'test-upload-id',
          key: 'test-key',
          parts: [{ part_no: 1, etag: 'test-etag' }]
        }
      });

      expect(result).toEqual({
        url: 'https://cdn.example.com/final-url',
        mime_type: 'text/plain'
      });
    });

    it('successfully uploads a file for wave path', async () => {
      await multiPartUpload({
        file: mockFile,
        path: 'wave'
      });

      expect(mockCommonApiPost).toHaveBeenNthCalledWith(1, {
        endpoint: 'wave-media/multipart-upload',
        body: {
          file_name: 'test.txt',
          content_type: 'text/plain'
        }
      });
    });
  });

  describe('Progress Tracking', () => {
    it('calls onProgress with correct percentage', async () => {
      const progressSpy = jest.fn();
      
      // Mock axios.put to simulate progress
      mockAxios.put.mockImplementation((url, data, config: any) => {
        // Simulate progress callback
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 });
          config.onUploadProgress({ loaded: 100, total: 100 });
        }
        return Promise.resolve({
          headers: { etag: '"test-etag"' },
          status: 200
        });
      });

      await multiPartUpload({
        file: mockFile,
        path: 'drop',
        onProgress: progressSpy
      });

      // Verify progress was called
      expect(progressSpy).toHaveBeenCalled();
    });

    it('works without onProgress callback', async () => {
      const result = await multiPartUpload({
        file: mockFile,
        path: 'drop'
        // No onProgress provided
      });

      expect(result).toEqual({
        url: 'https://cdn.example.com/final-url',
        mime_type: 'text/plain'
      });
    });
  });

  describe('Error Handling', () => {
    it('throws error when start upload fails to return upload_id', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost.mockResolvedValueOnce({ key: 'test-key' }); // Missing upload_id

      await expect(
        multiPartUpload({
          file: mockFile,
          path: 'drop'
        })
      ).rejects.toThrow('Server did not return required upload_id or key');
    });

    it('throws error when start upload fails to return key', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost.mockResolvedValueOnce({ upload_id: 'test-id' }); // Missing key

      await expect(
        multiPartUpload({
          file: mockFile,
          path: 'drop'
        })
      ).rejects.toThrow('Server did not return required upload_id or key');
    });

    it('throws error when part upload fails to return upload_url', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost
        .mockResolvedValueOnce(mockStartResponse)
        .mockResolvedValueOnce({ part_no: 1 }); // Missing upload_url

      await expect(
        multiPartUpload({
          file: mockFile,
          path: 'drop'
        })
      ).rejects.toThrow('No upload_url returned for part 1');
    });

    it('throws error when S3 upload fails to return ETag', async () => {
      mockAxios.put.mockResolvedValue({
        headers: {}, // No etag header
        status: 200
      });

      await expect(
        multiPartUpload({
          file: mockFile,
          path: 'drop'
        })
      ).rejects.toThrow('No ETag returned for part 1');
    });

    it('throws error when completion fails to return media_url', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost
        .mockResolvedValueOnce(mockStartResponse)
        .mockResolvedValueOnce(mockPartResponse)
        .mockResolvedValueOnce({}); // Missing media_url
      
      mockAxios.put.mockResolvedValueOnce({
        headers: { etag: '"test-etag"' },
        status: 200
      });

      await expect(
        multiPartUpload({
          file: mockFile,
          path: 'drop'
        })
      ).rejects.toThrow('No final media_url returned from completion endpoint');
    });
  });

  describe('Large File Handling', () => {
    it('handles multiple parts for large files', async () => {
      // Create a mock file larger than PART_SIZE (5MB)
      const largeFile = {
        size: 10 * 1024 * 1024, // 10MB
        name: 'large.txt',
        type: 'text/plain',
        slice: jest.fn().mockReturnValue(new Blob(['part']))
      } as unknown as File;

      // Reset and setup mocks for multiple parts
      mockCommonApiPost.mockReset();
      mockCommonApiPost
        .mockResolvedValueOnce(mockStartResponse) // Start
        .mockResolvedValueOnce({ upload_url: 'url1', part_no: 1 }) // Part 1
        .mockResolvedValueOnce({ upload_url: 'url2', part_no: 2 }) // Part 2
        .mockResolvedValueOnce(mockCompleteResponse); // Complete

      mockAxios.put
        .mockResolvedValueOnce({ headers: { etag: '"etag1"' }, status: 200 })
        .mockResolvedValueOnce({ headers: { etag: '"etag2"' }, status: 200 });

      const result = await multiPartUpload({
        file: largeFile,
        path: 'drop'
      });

      // Should have made 2 part upload requests
      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drop-media/multipart-upload/part',
        body: { upload_id: 'test-upload-id', key: 'test-key', part_no: 1 }
      });
      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drop-media/multipart-upload/part',
        body: { upload_id: 'test-upload-id', key: 'test-key', part_no: 2 }
      });

      // Completion should include both parts
      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drop-media/multipart-upload/completion',
        body: {
          upload_id: 'test-upload-id',
          key: 'test-key',
          parts: [
            { part_no: 1, etag: 'etag1' },
            { part_no: 2, etag: 'etag2' }
          ]
        }
      });

      expect(result.url).toBe('https://cdn.example.com/final-url');
    });
  });

  describe('Concurrency and Retry Configuration', () => {
    it('uses pLimit for concurrency control', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost
        .mockResolvedValueOnce(mockStartResponse) // Start multipart
        .mockResolvedValueOnce(mockPartResponse) // Get part URL
        .mockResolvedValueOnce(mockCompleteResponse); // Complete multipart

      await multiPartUpload({
        file: mockFile,
        path: 'drop'
      });

      expect(mockPLimit).toHaveBeenCalledWith(5); // CONCURRENCY = 5
    });

    it('uses pRetry for error resilience', async () => {
      mockCommonApiPost.mockReset();
      mockCommonApiPost
        .mockResolvedValueOnce(mockStartResponse) // Start multipart
        .mockResolvedValueOnce(mockPartResponse) // Get part URL
        .mockResolvedValueOnce(mockCompleteResponse); // Complete multipart

      await multiPartUpload({
        file: mockFile,
        path: 'drop'
      });

      expect(mockPRetry).toHaveBeenCalledWith(
        expect.any(Function),
        {
          retries: 3,
          factor: 2,
          minTimeout: 1000
        }
      );
    });
  });

  describe('ETag Processing', () => {
    it('removes quotes from ETag header', async () => {
      mockAxios.put.mockResolvedValue({
        headers: { etag: '"quoted-etag"' },
        status: 200
      });

      await multiPartUpload({
        file: mockFile,
        path: 'drop'
      });

      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drop-media/multipart-upload/completion',
        body: {
          upload_id: 'test-upload-id',
          key: 'test-key',
          parts: [{ part_no: 1, etag: 'quoted-etag' }] // Quotes removed
        }
      });
    });

    it('handles ETag without quotes', async () => {
      mockAxios.put.mockResolvedValue({
        headers: { etag: 'unquoted-etag' },
        status: 200
      });

      await multiPartUpload({
        file: mockFile,
        path: 'drop'
      });

      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drop-media/multipart-upload/completion',
        body: {
          upload_id: 'test-upload-id',
          key: 'test-key',
          parts: [{ part_no: 1, etag: 'unquoted-etag' }]
        }
      });
    });
  });
});