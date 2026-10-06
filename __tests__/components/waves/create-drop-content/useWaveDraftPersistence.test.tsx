import { renderHook } from "@testing-library/react";
import { act } from "react";
import type { EditorState } from "lexical";
import { useWaveDraftPersistence } from "@/components/waves/create-drop-content/useWaveDraftPersistence";
import {
  clearWaveDraft,
  readRestorableWaveDraft,
  writeWaveDraft,
} from "@/helpers/waves/wave-draft.helpers";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

jest.mock("@/helpers/waves/wave-draft.helpers", () => ({
  clearWaveDraft: jest.fn(),
  readRestorableWaveDraft: jest.fn(),
  writeWaveDraft: jest.fn(),
}));
jest.mock("@/contexts/EditingDropContext", () => ({
  useEditingDrop: jest.fn(),
}));

const clearWaveDraftMock = clearWaveDraft as jest.Mock;
const readRestorableWaveDraftMock = readRestorableWaveDraft as jest.Mock;
const writeWaveDraftMock = writeWaveDraft as jest.Mock;
const useEditingDropMock = useEditingDrop as jest.Mock;

const WAVE_ID = "wave-1";

const makeEditorState = (json: unknown) =>
  ({ toJSON: () => json }) as unknown as EditorState;

/** Mount draft persistence with independently changeable chat/submission state. */
const renderPersistence = (
  initialProps: Partial<{
    isDropMode: boolean;
    activeDrop: ActiveDropState | null;
    editorState: EditorState | null;
    dropEditorRefreshKey: number;
  }> = {}
) =>
  renderHook(
    (props: {
      isDropMode?: boolean;
      activeDrop: ActiveDropState | null;
      editorState: EditorState | null;
      dropEditorRefreshKey: number;
    }) =>
      useWaveDraftPersistence({
        waveId: WAVE_ID,
        isDropMode: props.isDropMode ?? false,
        activeDrop: props.activeDrop,
        editorState: props.editorState,
        dropEditorRefreshKey: props.dropEditorRefreshKey,
      }),
    {
      initialProps: {
        activeDrop: null,
        editorState: null,
        dropEditorRefreshKey: 0,
        ...initialProps,
      },
    }
  );

describe("useWaveDraftPersistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useEditingDropMock.mockReturnValue({ editingDropId: null });
    readRestorableWaveDraftMock.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the stored draft for the mount editor only", () => {
    readRestorableWaveDraftMock.mockReturnValue('{"root":{}}');

    const { result, rerender } = renderPersistence();

    expect(readRestorableWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
    expect(result.current.initialDraftJson).toBe('{"root":{}}');

    // A refresh-key bump means the editor was intentionally reset; the
    // restored draft must not seed the fresh editor.
    rerender({ activeDrop: null, editorState: null, dropEditorRefreshKey: 1 });
    expect(result.current.initialDraftJson).toBeNull();
  });

  it("does not read a draft while a reply or edit is active at mount", () => {
    const activeDrop = { action: "reply" } as unknown as ActiveDropState;

    const { result } = renderPersistence({ activeDrop });

    expect(readRestorableWaveDraftMock).not.toHaveBeenCalled();
    expect(result.current.initialDraftJson).toBeNull();
  });

  it("saves the serialized editor state after the debounce", () => {
    const { rerender } = renderPersistence();

    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "hello" } }),
      dropEditorRefreshKey: 0,
    });

    expect(writeWaveDraftMock).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(writeWaveDraftMock).toHaveBeenCalledWith(
      WAVE_ID,
      JSON.stringify({ root: { text: "hello" } })
    );
  });

  it.each([0, 1000])(
    "leaves the chat draft untouched when a submission closes after %i ms",
    (elapsed) => {
      readRestorableWaveDraftMock.mockReturnValue('{"root":{"text":"chat"}}');
      const { result, unmount } = renderPersistence({
        isDropMode: true,
        editorState: makeEditorState({ root: { text: "submission" } }),
      });

      expect(result.current.initialDraftJson).toBeNull();
      expect(readRestorableWaveDraftMock).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(elapsed));
      unmount();

      expect(writeWaveDraftMock).not.toHaveBeenCalled();
      expect(clearWaveDraftMock).not.toHaveBeenCalled();
    }
  );

  it("does not seed or save a submission when the composer changes mode", () => {
    readRestorableWaveDraftMock.mockReturnValue('{"root":{"text":"chat"}}');
    const { result, rerender, unmount } = renderPersistence({
      editorState: makeEditorState({ root: { text: "chat" } }),
    });
    rerender({
      isDropMode: true,
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "submission" } }),
      dropEditorRefreshKey: 0,
    });

    expect(result.current.initialDraftJson).toBeNull();
    unmount();
    expect(writeWaveDraftMock).not.toHaveBeenCalled();
    expect(clearWaveDraftMock).not.toHaveBeenCalled();
  });

  it("does not clear the chat draft when a submission resets", () => {
    const { rerender, unmount } = renderPersistence({ isDropMode: true });
    rerender({
      isDropMode: true,
      activeDrop: null,
      editorState: null,
      dropEditorRefreshKey: 1,
    });
    act(() => jest.advanceTimersByTime(1000));
    unmount();

    expect(clearWaveDraftMock).not.toHaveBeenCalled();
    expect(writeWaveDraftMock).not.toHaveBeenCalled();
  });

  it("never saves while a reply or quote is active", () => {
    const { rerender } = renderPersistence();

    rerender({
      activeDrop: { action: "reply" } as unknown as ActiveDropState,
      editorState: makeEditorState({ root: { text: "reply text" } }),
      dropEditorRefreshKey: 0,
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(writeWaveDraftMock).not.toHaveBeenCalled();
  });

  it("saves the latest draft when unmounted before the debounce", () => {
    const { rerender, unmount } = renderPersistence();
    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "first" } }),
      dropEditorRefreshKey: 0,
    });
    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "latest" } }),
      dropEditorRefreshKey: 0,
    });
    expect(writeWaveDraftMock).not.toHaveBeenCalled();

    unmount();

    expect(writeWaveDraftMock).toHaveBeenCalledTimes(1);
    expect(writeWaveDraftMock).toHaveBeenCalledWith(
      WAVE_ID,
      JSON.stringify({ root: { text: "latest" } })
    );
    act(() => jest.advanceTimersByTime(1000));
    expect(writeWaveDraftMock).toHaveBeenCalledTimes(1);
  });

  it("does not erase a restored draft when closed before editor initialization", () => {
    readRestorableWaveDraftMock.mockReturnValue('{"root":{}}');
    const { unmount } = renderPersistence();

    unmount();

    expect(clearWaveDraftMock).not.toHaveBeenCalled();
    expect(writeWaveDraftMock).not.toHaveBeenCalled();
  });

  it.each(["reply", "quote"])(
    "does not flush %s content as a primary draft on unmount",
    (action) => {
      const { rerender, unmount } = renderPersistence();
      rerender({
        activeDrop: null,
        editorState: makeEditorState({ root: { text: "primary draft" } }),
        dropEditorRefreshKey: 0,
      });
      rerender({
        activeDrop: { action } as unknown as ActiveDropState,
        editorState: makeEditorState({ root: { text: "other content" } }),
        dropEditorRefreshKey: 0,
      });

      unmount();

      expect(writeWaveDraftMock).not.toHaveBeenCalled();
    }
  );

  it("does not flush edited content as a primary draft on unmount", () => {
    const { rerender, unmount } = renderPersistence();
    useEditingDropMock.mockReturnValue({ editingDropId: "edited-drop" });
    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "edited content" } }),
      dropEditorRefreshKey: 0,
    });

    unmount();

    expect(writeWaveDraftMock).not.toHaveBeenCalled();
  });

  it("does not resurrect a draft when submitted before the debounce", () => {
    const { rerender, unmount } = renderPersistence();
    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "sent" } }),
      dropEditorRefreshKey: 0,
    });
    rerender({ activeDrop: null, editorState: null, dropEditorRefreshKey: 1 });

    unmount();

    expect(clearWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
    expect(writeWaveDraftMock).not.toHaveBeenCalled();
  });

  it("clears the stored draft immediately when the editor resets after submit", () => {
    const { rerender } = renderPersistence();

    rerender({
      activeDrop: null,
      editorState: makeEditorState({ root: { text: "sent" } }),
      dropEditorRefreshKey: 0,
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(writeWaveDraftMock).toHaveBeenCalledTimes(1);

    // Submit clears the editor and bumps the refresh key; the draft must be
    // dropped without waiting for a debounced empty-state write.
    rerender({ activeDrop: null, editorState: null, dropEditorRefreshKey: 1 });

    expect(clearWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
  });

  it("clears the stored draft when serialization fails", () => {
    const { rerender } = renderPersistence();

    rerender({
      activeDrop: null,
      editorState: {
        toJSON: () => {
          throw new Error("unserializable");
        },
      } as unknown as EditorState,
      dropEditorRefreshKey: 0,
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(writeWaveDraftMock).not.toHaveBeenCalled();
    expect(clearWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
  });
});
