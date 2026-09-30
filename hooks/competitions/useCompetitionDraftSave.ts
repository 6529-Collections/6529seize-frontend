"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { newCompetitionRequestKey } from "@/helpers/competition.helpers";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  createCompetition,
  updateCompetition,
  invalidateCompetition,
} from "@/services/api/competitions-api";

import {
  createCompetitionDraftStorage,
  type CompetitionEditorDraft,
  type SavedCompetitionDraft as SavedCompetition,
} from "@/helpers/competition-editor-draft.helpers";

function persistDraft(
  waveId: string,
  competition: SavedCompetition | null,
  pending: NonNullable<CompetitionEditorDraft["pending"]>
) {
  const config = JSON.parse(pending.fingerprint) as ApiCompetitionDraftInput;
  return competition
    ? updateCompetition(
        { waveId, competitionId: competition.id },
        {
          idempotency_key: pending.key,
          config_version: competition.config_version,
          config,
        }
      )
    : createCompetition(waveId, { idempotency_key: pending.key, config });
}

function useLatestDraftInput(
  input: ApiCompetitionDraftInput,
  fingerprint: string,
  canSave: boolean
) {
  const current = useRef({ input, fingerprint, canSave });
  useLayoutEffect(() => {
    current.current = { input, fingerprint, canSave };
  }, [input, fingerprint, canSave]);
  return current;
}

function useUnsavedCompetitionWarning(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) return;
    const preventExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", preventExit);
    return () => globalThis.removeEventListener("beforeunload", preventExit);
  }, [unsaved]);
}

interface CompetitionDraftSaveOptions {
  readonly waveId: string;
  readonly storageKey: string;
  readonly input: ApiCompetitionDraftInput;
  readonly competition: ApiCompetition | undefined;
  readonly restored: CompetitionEditorDraft | null;
  readonly initialFingerprint: string;
  readonly canSave: boolean;
  readonly requestAuth: () => Promise<{ success: boolean }>;
}

function useDraftAutosave({
  enabled,
  fingerprint,
  savedFingerprint,
  failed,
  pending,
  save,
}: {
  readonly enabled: boolean;
  readonly fingerprint: string;
  readonly savedFingerprint: string;
  readonly failed: RefObject<{ fingerprint: string; conflict: boolean } | null>;
  readonly pending: RefObject<CompetitionEditorDraft["pending"]>;
  readonly save: () => Promise<SavedCompetition | null>;
}) {
  useEffect(() => {
    if (
      !enabled ||
      (fingerprint === savedFingerprint && !pending.current) ||
      failed.current?.conflict ||
      failed.current?.fingerprint === fingerprint
    )
      return;
    const timer = setTimeout(() => {
      void save();
    }, 800);
    return () => clearTimeout(timer);
  }, [enabled, fingerprint, savedFingerprint, failed, pending, save]);
}

export function useCompetitionDraftSave({
  waveId,
  storageKey,
  input,
  competition,
  restored,
  initialFingerprint,
  canSave,
  requestAuth,
}: CompetitionDraftSaveOptions) {
  const client = useQueryClient();
  const fingerprint = JSON.stringify(input);
  const server = useRef<SavedCompetition | null>(
    restored?.competition ?? competition ?? null
  );
  const pending = useRef(restored?.pending ?? null);
  const [savedFingerprint, setSavedFingerprint] = useState(
    restored?.savedFingerprint ?? initialFingerprint
  );
  const saved = useRef(savedFingerprint);
  const current = useLatestDraftInput(input, fingerprint, canSave);
  const [busy, setBusy] = useState(false);
  const [backup] = useState(() => createCompetitionDraftStorage(storageKey));
  const localFingerprint = useSyncExternalStore(
    backup.subscribe,
    backup.getSnapshot,
    backup.getServerSnapshot
  );
  const localSaved = localFingerprint === fingerprint;
  const [error, setError] = useState<"conflict" | "failure" | null>(
    restored?.pending ? "failure" : null
  );
  const failed = useRef<{ fingerprint: string; conflict: boolean } | null>(
    null
  );
  const inFlight = useRef<Promise<SavedCompetition | null> | null>(null);

  const retain = useCallback(
    () =>
      backup.write({
        input: current.current.input,
        competition: server.current,
        savedFingerprint: saved.current,
        pending: pending.current,
      }),
    [backup, current]
  );

  useEffect(() => {
    // Sync every edit to external storage, including temporarily invalid fields.
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-live-state-to-parent, react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-ref-to-parent -- This writes to a localStorage-backed external store, not a parent callback.
    backup.write({
      input,
      competition: server.current,
      savedFingerprint,
      pending: pending.current,
    });
  }, [input, savedFingerprint, backup]);

  const save = useCallback(async (): Promise<SavedCompetition | null> => {
    if (inFlight.current) {
      const previous = await inFlight.current;
      if (!previous) return null;
    }
    const snapshot = current.current;
    if (snapshot.fingerprint === saved.current && !pending.current)
      return server.current;
    if (!snapshot.canSave || failed.current?.conflict) return null;
    // A second caller may have started the next save while this one was awaiting.
    if (inFlight.current) return inFlight.current;
    setBusy(true);
    setError(null);
    const operation = async () => {
      try {
        if (!(await requestAuth()).success) {
          failed.current = {
            fingerprint: snapshot.fingerprint,
            conflict: false,
          };
          setError("failure");
          return null;
        }
        // Resolve an uncertain request with its original payload and key before
        // saving newer edits. The first response may have been lost after commit.
        const saveFingerprint = async (nextFingerprint: string) => {
          if (pending.current?.fingerprint !== nextFingerprint) {
            pending.current = {
              fingerprint: nextFingerprint,
              key: newCompetitionRequestKey(),
            };
          }
          retain();
          const result = await persistDraft(
            waveId,
            server.current,
            pending.current
          );
          server.current = {
            id: result.id,
            config_version: result.config_version,
          };
          saved.current = nextFingerprint;
          pending.current = null;
          failed.current = null;
          setSavedFingerprint(nextFingerprint);
          retain();
          await invalidateCompetition(client, {
            waveId,
            competitionId: result.id,
          });
        };
        if (
          pending.current &&
          pending.current.fingerprint !== snapshot.fingerprint
        ) {
          await saveFingerprint(pending.current.fingerprint);
        }
        await saveFingerprint(snapshot.fingerprint);
        return server.current;
      } catch (error_) {
        const status = getStructuredApiErrorStatus(error_);
        const conflict = status === 409;
        if (
          status !== undefined &&
          status >= 400 &&
          status < 500 &&
          !conflict
        ) {
          pending.current = null;
          retain();
        }
        failed.current = { fingerprint: snapshot.fingerprint, conflict };
        setError(conflict ? "conflict" : "failure");
        return null;
      } finally {
        inFlight.current = null;
        setBusy(false);
      }
    };
    inFlight.current = operation();
    return inFlight.current;
  }, [client, current, requestAuth, retain, waveId]);

  useDraftAutosave({
    enabled: !busy && canSave,
    fingerprint,
    savedFingerprint,
    failed,
    pending,
    save,
  });

  useUnsavedCompetitionWarning(!localSaved && fingerprint !== savedFingerprint);

  const clear = () => backup.clear(server.current);
  return {
    save,
    retain,
    clear,
    busy,
    error,
    localSaved,
    isSaved: fingerprint === savedFingerprint && !busy && error === null,
  };
}
