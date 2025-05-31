import { fileUploaderReducer, initialFileUploaderState } from '../../../../../../components/waves/memes/file-upload/reducers/fileUploadReducer';

const sampleFile = new File(['a'], 'a.txt', { type: 'text/plain' });

beforeAll(() => {
  (global as any).URL.revokeObjectURL = jest.fn();
  (global as any).clearTimeout = jest.fn();
});

describe('fileUploaderReducer', () => {
  it('sets visual state', () => {
    const state = fileUploaderReducer(initialFileUploaderState, { type: 'SET_VISUAL_STATE', payload: 'dragging' });
    expect(state.visualState).toBe('dragging');
  });

  it('handles processing success', () => {
    const action = { type: 'PROCESSING_SUCCESS', payload: { objectUrl: 'url', file: sampleFile } } as any;
    const state = fileUploaderReducer(initialFileUploaderState, action);
    expect(state.objectUrl).toBe('url');
    expect(state.currentFile).toBe(sampleFile);
    expect(state.visualState).toBe('idle');
  });

  it('resets state', () => {
    const modified = { ...initialFileUploaderState, visualState: 'dragging', objectUrl: 'url', processingTimeout: 1 };
    const state = fileUploaderReducer(modified, { type: 'RESET_STATE' } as any);
    expect(state).toEqual(initialFileUploaderState);
  });

  it('increments attempts on start processing and handles error', () => {
    const state1 = fileUploaderReducer(initialFileUploaderState, { type: 'START_PROCESSING', payload: sampleFile } as any);
    expect(state1.processingAttempts).toBe(1);
    const state2 = fileUploaderReducer(state1, { type: 'PROCESSING_ERROR', payload: 'bad' } as any);
    expect(state2.visualState).toBe('invalid');
    expect(state2.hasRecoveryOption).toBe(true);
  });

  it('handles timeout and compatibility check', () => {
    const state = fileUploaderReducer(initialFileUploaderState, { type: 'START_COMPATIBILITY_CHECK', payload: sampleFile } as any);
    expect(state.isCheckingCompatibility).toBe(true);
    const timeout = fileUploaderReducer(state, { type: 'PROCESSING_TIMEOUT' } as any);
    expect(timeout.error).toMatch('timed out');
    const compat = fileUploaderReducer(state, { type: 'SET_COMPATIBILITY_RESULT', payload: { tested: true, canPlay: true } } as any);
    expect(compat.videoCompatibility).toEqual({ tested: true, canPlay: true });
  });
});
