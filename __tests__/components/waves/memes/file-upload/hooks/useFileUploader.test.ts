import { renderHook, act } from '@testing-library/react';
import useFileUploader from '@/components/waves/memes/file-upload/hooks/useFileUploader';

jest.mock('@/components/waves/memes/file-upload/utils/fileValidation', () => ({
  validateFile: jest.fn(() => ({ valid: true })),
  testVideoCompatibility: jest.fn(() => Promise.resolve({ canPlay: true, tested: true }))
}));

const createUrl = jest.fn(() => 'blob:url');
const revokeUrl = jest.fn();

Object.defineProperty(global, 'URL', {
  value: { createObjectURL: createUrl, revokeObjectURL: revokeUrl }
});

describe('useFileUploader', () => {
  const file = new File(['a'], 'a.png', { type: 'image/png' });

  beforeEach(() => {
    const { validateFile } = require('@/components/waves/memes/file-upload/utils/fileValidation');
    validateFile.mockClear();
  });

  it('processes valid file', async () => {
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() => useFileUploader({ onFileSelect, setUploaded }));
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.objectUrl).toBe('blob:url');
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('resets state and revokes url on remove', async () => {
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() => useFileUploader({ onFileSelect, setUploaded }));
    await act(async () => {
      result.current.processFile(file);
    });
    act(() => {
      result.current.handleRemoveFile({ stopPropagation() {}, preventDefault() {} } as any);
    });
    expect(revokeUrl).toHaveBeenCalled();
    expect(setUploaded).toHaveBeenCalledWith(false);
    expect(result.current.state.objectUrl).toBeNull();
  });

  it('shows error toast on invalid file', async () => {
    const { validateFile } = require('@/components/waves/memes/file-upload/utils/fileValidation');
    validateFile.mockReturnValueOnce({ valid: false, error: 'nope' });
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const showToast = jest.fn();
    const { result } = renderHook(() => useFileUploader({ onFileSelect, setUploaded, showToast }));
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.error).toBe('nope');
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'nope' }));
  });

  it('retries processing when handleRetry called', async () => {
    const { validateFile } = require('@/components/waves/memes/file-upload/utils/fileValidation');
    validateFile
      .mockReturnValueOnce({ valid: false, error: 'err' })
      .mockReturnValue({ valid: true });
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() => useFileUploader({ onFileSelect, setUploaded }));
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.error).toBe('err');
    await act(async () => {
      result.current.handleRetry();
    });
    expect(validateFile).toHaveBeenCalledTimes(2);
    expect(result.current.state.objectUrl).toBe('blob:url');
  });
});
