import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { EditorState } from "lexical";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import {
  clearWaveDraft,
  readRestorableWaveDraft,
  writeWaveDraft,
} from "@/helpers/waves/wave-draft.helpers";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

const persistEditorState = (
  waveId: string,
  editorState: EditorState | null
) => {
  let serialized: string | null = null;
  try {
    serialized = editorState ? JSON.stringify(editorState.toJSON()) : null;
  } catch {
    serialized = null;
  }
  if (serialized) writeWaveDraft(waveId, serialized);
  else clearWaveDraft(waveId);
};

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
    const handle = setTimeout(
      () => persistEditorState(draftWaveId, editorState),
      400
    );
    return () => clearTimeout(handle);
  }, [editorState, draftWaveId, isMountEditor]);

  const flushBeforeTabLeave = useEffectEvent(() => {
    // Reply/quote/edit content must never replace the primary composer draft.
    // A restoring editor may not have reported its initial state yet.
    if (draftWaveId && editorState)
      persistEditorState(draftWaveId, editorState);
  });
  useLayoutEffect(() => {
    let profileInvalidated = false;
    const invalidate = () => {
      profileInvalidated = true;
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, invalidate);
    return () => {
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, invalidate);
      // Fast tab/history changes can leave before the 400ms autosave runs.
      // Flush during teardown while this primary editor still owns its draft.
      if (!profileInvalidated) flushBeforeTabLeave();
    };
  }, []);

  return { initialDraftJson: isMountEditor ? initialDraftJson : null };
};
