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
 * Persist an in-progress chat message across a full reload (e.g. the
 * new-version toast). Keyed by wave and scoped to the PRIMARY composer:
 * the stream composer is a single instance whose `activeDrop` can flip to
 * reply/quote (see MyStreamWaveChat), so `draftWaveId` is derived live.
 * The autosave effect early-returns whenever it is null, which is what
 * guarantees reply/quote/edit content is never written under the primary
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
  activeDrop,
  editorState,
  dropEditorRefreshKey,
}: {
  readonly waveId: string;
  readonly activeDrop: ActiveDropState | null;
  readonly editorState: EditorState | null;
  readonly dropEditorRefreshKey: number;
}): {
  readonly initialDraftJson: string | null;
} => {
  const { editingDropId } = useEditingDrop();
  const draftWaveId = activeDrop === null && !editingDropId ? waveId : null;
  const mountRefreshKeyRef = useRef(dropEditorRefreshKey);
  const isMountEditor = dropEditorRefreshKey === mountRefreshKeyRef.current;
  const [initialDraftJson] = useState<string | null>(() =>
    draftWaveId ? readRestorableWaveDraft(draftWaveId) : null
  );

  useEffect(() => {
    if (!draftWaveId) {
      return;
    }
    if (!isMountEditor && !editorState) {
      // Editor was reset (submit or wave-level refresh): drop the persisted
      // draft right away instead of after the debounce below.
      clearWaveDraft(draftWaveId);
      return;
    }
    const handle = setTimeout(() => {
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
    }, 400);
    return () => clearTimeout(handle);
  }, [editorState, draftWaveId, isMountEditor]);

  return { initialDraftJson: isMountEditor ? initialDraftJson : null };
};
