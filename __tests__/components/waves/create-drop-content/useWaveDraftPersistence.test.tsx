import { renderHook } from "@testing-library/react";
import { act } from "react";
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

const makeEditorState = (json: unknown) => ({ toJSON: () => json }) as any;

const renderPersistence = (
  initialProps: Partial<{
    activeDrop: ActiveDropState | null;
    editorState: any;
    dropEditorRefreshKey: number;
  }> = {}
) =>
  renderHook(
    (props: {
      activeDrop: ActiveDropState | null;
      editorState: any;
      dropEditorRefreshKey: number;
    }) =>
      useWaveDraftPersistence({
        waveId: WAVE_ID,
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
      } as any,
      dropEditorRefreshKey: 0,
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(writeWaveDraftMock).not.toHaveBeenCalled();
    expect(clearWaveDraftMock).toHaveBeenCalledWith(WAVE_ID);
  });
});
