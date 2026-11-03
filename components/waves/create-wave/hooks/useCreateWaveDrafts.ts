"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import { CreateWaveStep as CreateWaveStepEnum } from "@/types/waves.types";
import type {
  CreateWaveDraft,
  CreateWaveDraftEndDateConfig,
} from "@/helpers/waves/create-wave-draft.helpers";
import {
  deleteCreateWaveDraft,
  getCreateWaveDraftsSnapshot,
  getServerCreateWaveDraftsSnapshot,
  subscribeToCreateWaveDrafts,
  upsertCreateWaveDraft,
} from "@/helpers/waves/create-wave-draft.helpers";
// Not crypto.randomUUID: that needs a secure context, and the create flow
// runs on plain-http LAN origins during device testing where it throws.
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import type { CreateDropConfig } from "@/entities/IDrop";

// Long enough to coalesce a burst of edits, short enough that closing the
// tab right after typing loses at most a keystroke or two.
const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Autosaves the in-progress wave config as an on-device draft and exposes
 * the saved drafts for the Overview step's resume UI.
 *
 * Scoped drafts save once the wave has a name, including first-post edits on
 * the initial screen. The legacy unscoped API still starts after Overview.
 * Deleting or completing a draft cancels its pending save.
 */
export const useCreateWaveDrafts = ({
  config,
  endDateConfig,
  step,
  scope,
  description = null,
  mediaOmitted = false,
  enabled = true,
}: {
  readonly config: CreateWaveConfig;
  readonly endDateConfig: CreateWaveDraftEndDateConfig;
  readonly step: CreateWaveStep;
  readonly scope?: string;
  readonly description?: CreateDropConfig | null;
  readonly mediaOmitted?: boolean;
  readonly enabled?: boolean;
}) => {
  // Drafts live in localStorage; reading them through an external store keeps
  // the SSR/first-client render empty (no localStorage on the server) and
  // repopulates after hydration, without an init-in-effect. Every write path
  // (upsert/delete) notifies the store, so this stays current automatically.
  const drafts = useSyncExternalStore(
    subscribeToCreateWaveDrafts,
    useCallback(
      () =>
        enabled
          ? getCreateWaveDraftsSnapshot(scope)
          : getServerCreateWaveDraftsSnapshot(),
      [scope, enabled]
    ),
    getServerCreateWaveDraftsSnapshot
  );
  // The active draft id never renders, and load/save/clear must read and
  // write it synchronously within a single event — a ref avoids any
  // cross-render timing where a debounce could fork a duplicate before a
  // loaded id has committed.
  const activeDraftIdRef = useRef<string | null>(null);
  // Autosave is armed only while tracking a draft. It arms on the
  // Overview→next transition (or when a draft is loaded) and disarms on
  // clear/delete — so a discarded draft is never immediately re-saved.
  const isTrackingRef = useRef(false);
  const previousStepRef = useRef(step);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const saveNow = useCallback(
    (snapshot = description) => {
      if (!enabled || !config.overview.name.trim()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const id = activeDraftIdRef.current ?? getRandomObjectId();
      activeDraftIdRef.current = id;
      isTrackingRef.current = true;
      upsertCreateWaveDraft(
        {
          id,
          updatedAt: Date.now(),
          config,
          endDateConfig,
          description: snapshot,
          mediaOmitted,
        },
        scope
      );
    },
    [enabled, config, endDateConfig, description, mediaOmitted, scope]
  );

  useEffect(() => {
    const leftOverview =
      previousStepRef.current === CreateWaveStepEnum.OVERVIEW &&
      step !== CreateWaveStepEnum.OVERVIEW;
    previousStepRef.current = step;
    if (leftOverview || (scope && config.overview.name.trim())) {
      isTrackingRef.current = true;
    }
    if (!enabled || !isTrackingRef.current || !config.overview.name.trim()) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveNow();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [config.overview.name, endDateConfig, step, scope, enabled, saveNow]);

  const loadDraft = useCallback((draft: CreateWaveDraft) => {
    // Editing continues under the loaded draft's identity, so subsequent
    // autosaves update it rather than forking a copy.
    isTrackingRef.current = true;
    activeDraftIdRef.current = draft.id;
  }, []);

  const deleteDraft = useCallback(
    (id: string) => {
      if (activeDraftIdRef.current === id && debounceRef.current)
        clearTimeout(debounceRef.current);
      deleteCreateWaveDraft(id, scope);
      if (activeDraftIdRef.current === id) {
        // Do not immediately re-save what the user just discarded.
        activeDraftIdRef.current = null;
        isTrackingRef.current = false;
      }
    },
    [scope]
  );

  /** Called after the server confirms the wave exists. */
  const clearActiveDraft = useCallback(() => {
    isTrackingRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (activeDraftIdRef.current !== null) {
      deleteCreateWaveDraft(activeDraftIdRef.current, scope);
      activeDraftIdRef.current = null;
    }
  }, [scope]);

  return { drafts, loadDraft, deleteDraft, clearActiveDraft, saveNow };
};
