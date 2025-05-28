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
});
