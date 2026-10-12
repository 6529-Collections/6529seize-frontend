import { useEffect, useRef, useState } from "react";
import type { EditorState } from "lexical";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import {
  clearWaveDraft,
  readRestorableWaveDraft,
  writeWaveDraft,
} from "@/helpers/waves/wave-draft.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

/**
 * Persist an in-progress chat message across a reload or a temporary tab
 * change. Keyed by wave and scoped to the PRIMARY composer:
 * the stream composer is a single instance whose `activeDrop` can flip to
 * reply/quote (see MyStreamWaveChat), so `draftWaveId` is derived live.
 * The autosave effect early-returns whenever it is null, which is what
 * guarantees submission/reply/quote/edit content is never written under the primary
 * wave key — no cross-mode bleed.
 *
 * Restoration happens only at editor-creation time (initialConfig), so the
 * returned `initialDraftJson` is captured once at mount and nulled once
 * `dropEditorRefreshKey` moves past its mount value (a bump means the editor
 * was intentionally reset — e.g. a successful submit — so the persisted
 * draft is also dropped immediately rather than waiting for the debounced
 * empty-state write; a reload right after submit must not restore it).
 */
export const useWaveDraftPersistence = ({
  waveId,
  isDropMode,
  activeDrop,
  editorState,
  dropEditorRefreshKey,
}: {
  readonly waveId: string;
  readonly isDropMode: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly editorState: EditorState | null;
  readonly dropEditorRefreshKey: number;
}): {
  readonly initialDraftJson: string | null;
} => {
  const { editingDropId } = useEditingDrop();
  const draftWaveId =
    !isDropMode && activeDrop === null && !editingDropId ? waveId : null;
  const mountRefreshKeyRef = useRef(dropEditorRefreshKey);
  const isMountEditor = dropEditorRefreshKey === mountRefreshKeyRef.current;
  const [initialDraftJson] = useState<string | null>(() =>
    draftWaveId ? readRestorableWaveDraft(draftWaveId) : null
  );
  const pendingSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pendingSaveRef.current = null;
    if (!draftWaveId) {
      return;
    }
    if (!isMountEditor && !editorState) {
      // Editor was reset (submit or wave-level refresh): drop the persisted
      // draft right away instead of after the debounce below.
      clearWaveDraft(draftWaveId);
      return;
    }
    const saveDraft = () => {
      if (!editorState) {
        clearWaveDraft(draftWaveId);
        return;
      }
      let serialized: string | null = null;
      try {
        serialized = JSON.stringify(editorState.toJSON());
      } catch {
        serialized = null;
      }
      if (serialized) {
        writeWaveDraft(draftWaveId, serialized);
      } else {
        clearWaveDraft(draftWaveId);
      }
    };
    // A mount's empty editor state must not erase a restored draft before
    // Lexical has supplied its first state. Later empty states serialize and
    // clear normally through writeWaveDraft.
    pendingSaveRef.current = editorState ? saveDraft : null;
    const handle = setTimeout(() => {
      saveDraft();
      pendingSaveRef.current = null;
    }, 400);
    return () => clearTimeout(handle);
  }, [editorState, draftWaveId, isMountEditor]);

  useEffect(
    () => () => {
      // Switching to Configuration unmounts the composer. Save the latest
      // primary draft even when the debounce has not elapsed yet.
      pendingSaveRef.current?.();
      pendingSaveRef.current = null;
    },
    []
  );

  return {
    initialDraftJson: draftWaveId && isMountEditor ? initialDraftJson : null,
  };
};
