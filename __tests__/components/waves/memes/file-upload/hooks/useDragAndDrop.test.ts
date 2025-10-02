import { renderHook, act } from '@testing-library/react';
import useDragAndDrop from '@/components/waves/memes/file-upload/hooks/useDragAndDrop';

function setup(enabled = true) {
  const onFileDrop = jest.fn();
  const setVisualState = jest.fn();
  const { result } = renderHook(() =>
    useDragAndDrop({ enabled, onFileDrop, setVisualState })
  );
  return { result, onFileDrop, setVisualState };
}

describe('useDragAndDrop', () => {
  it('handles drag events when enabled', () => {
  const { result, setVisualState } = setup(true);
    result.current.dropAreaRef.current = document.createElement('div');
    act(() => {
      result.current.handleDragEnter({ preventDefault: jest.fn(), stopPropagation: jest.fn() } as any);
    });
    expect(setVisualState).toHaveBeenCalledWith('dragging');

    act(() => {
      result.current.handleDragOver({ preventDefault: jest.fn(), stopPropagation: jest.fn() } as any);
    });
    expect(setVisualState).toHaveBeenCalledTimes(2);

    const related = document.createElement('div');
    act(() => {
      result.current.handleDragLeave({ preventDefault: jest.fn(), stopPropagation: jest.fn(), relatedTarget: null } as any);
    });
    expect(setVisualState).toHaveBeenCalledWith('idle');
  });

  it('drops file and resets visual state', () => {
    const file = new File(['a'], 'a.txt');
    const { result, onFileDrop, setVisualState } = setup(true);
    act(() => {
      result.current.handleDrop({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [file] }
      } as any);
    });
    expect(onFileDrop).toHaveBeenCalledWith(file);
    expect(setVisualState).not.toHaveBeenCalledWith('idle');
  });

  it('ignores events when disabled', () => {
    const { result, setVisualState, onFileDrop } = setup(false);
    act(() => {
      result.current.handleDragEnter({ preventDefault: jest.fn(), stopPropagation: jest.fn() } as any);
      result.current.handleDrop({ preventDefault: jest.fn(), stopPropagation: jest.fn(), dataTransfer: { files: [new File([], 'x')] } } as any);
    });
    expect(setVisualState).not.toHaveBeenCalled();
    expect(onFileDrop).not.toHaveBeenCalled();
  });
});
