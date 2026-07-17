"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import { CreateWaveStep as CreateWaveStepEnum } from "@/types/waves.types";
import type {
  CreateWaveDraft,
  CreateWaveDraftEndDateConfig,
} from "@/helpers/waves/create-wave-draft.helpers";
import {
  deleteCreateWaveDraft,
  readCreateWaveDrafts,
  upsertCreateWaveDraft,
} from "@/helpers/waves/create-wave-draft.helpers";
// Not crypto.randomUUID: that needs a secure context, and the create flow
// runs on plain-http LAN origins during device testing where it throws.
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

// Long enough to coalesce a burst of edits, short enough that closing the
// tab right after typing loses at most a keystroke or two.
const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Autosaves the in-progress wave config as an on-device draft and exposes
 * the saved drafts for the Overview step's resume UI.
 *
 * Saving starts once the flow has left the Overview step at least once (a
 * named wave that passed validation) and keeps following every subsequent
 * config or step change — including edits made after navigating back to
 * Overview. Deleting the active draft (or creating the wave) stops the
 * autosave until the flow leaves Overview again.
 */
export const useCreateWaveDrafts = ({
  config,
  endDateConfig,
  step,
}: {
  readonly config: CreateWaveConfig;
  readonly endDateConfig: CreateWaveDraftEndDateConfig;
  readonly step: CreateWaveStep;
}) => {
  const [drafts, setDrafts] = useState<CreateWaveDraft[]>([]);
  // Only the setter's functional form is used; the id itself never renders.
  const [, setActiveDraftId] = useState<string | null>(null);
  // Autosave is armed only while tracking a draft. It arms on the
  // Overview→next transition (or when a draft is loaded) and disarms on
  // clear/delete — so a discarded draft is never immediately re-saved.
  const isTrackingRef = useRef(false);
  const previousStepRef = useRef(step);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    setDrafts(readCreateWaveDrafts());
  }, []);

  useEffect(() => {
    const leftOverview =
      previousStepRef.current === CreateWaveStepEnum.OVERVIEW &&
      step !== CreateWaveStepEnum.OVERVIEW;
    previousStepRef.current = step;
    if (leftOverview) {
      isTrackingRef.current = true;
    }
    if (!isTrackingRef.current || !config.overview.name.trim()) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setActiveDraftId((currentId) => {
        const id = currentId ?? getRandomObjectId();
        upsertCreateWaveDraft({
          id,
          updatedAt: Date.now(),
          config,
          endDateConfig,
        });
        setDrafts(readCreateWaveDrafts());
        return id;
      });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [config, endDateConfig, step]);

  const loadDraft = useCallback((draft: CreateWaveDraft) => {
    // Editing continues under the loaded draft's identity, so subsequent
    // autosaves update it rather than forking a copy.
    isTrackingRef.current = true;
    setActiveDraftId(draft.id);
  }, []);

  const deleteDraft = useCallback((id: string) => {
    deleteCreateWaveDraft(id);
    setDrafts(readCreateWaveDrafts());
    setActiveDraftId((currentId) => {
      if (currentId === id) {
        // Do not immediately re-save what the user just discarded.
        isTrackingRef.current = false;
        return null;
      }
      return currentId;
    });
  }, []);

  /** Called after the server confirms the wave exists. */
  const clearActiveDraft = useCallback(() => {
    isTrackingRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setActiveDraftId((currentId) => {
      if (currentId !== null) {
        deleteCreateWaveDraft(currentId);
        setDrafts(readCreateWaveDrafts());
      }
      return null;
    });
  }, []);

  return { drafts, loadDraft, deleteDraft, clearActiveDraft };
};
