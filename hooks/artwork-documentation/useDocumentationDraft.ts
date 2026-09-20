"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  DocumentationDraftController,
  type DraftSnapshot,
} from "@/lib/artwork-documentation/draft-controller";
import {
  activateDocumentationDraftRecovery,
  readDocumentationDraftRecovery,
  saveDocumentationDraftRecovery,
} from "@/lib/artwork-documentation/draft-recovery";
import { watchDocumentationRecoveryAuth } from "@/lib/artwork-documentation/draft-recovery-auth";
import {
  getDocumentationContext,
  patchDocumentationModule,
} from "@/services/api/artwork-documentation-api";

/** Parent keys the editor by authenticated profile, proxy and wallet. */
export function useDocumentationDraft(
  initial: ApiArtworkDocumentationContext,
  actorKey: string | null = null
) {
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false);
  const [snapshot, setSnapshot] = useState<DraftSnapshot>({
    context: initial,
    edits: [],
    state: "clean",
    latest: null,
    dirty: false,
    contentEdits: [],
  });
  const controller = useMemo(
    () =>
      new DocumentationDraftController(
        initial,
        { save: patchDocumentationModule, read: getDocumentationContext },
        (next) => {
          if (actorKey)
            setRecoveryUnavailable(
              !saveDocumentationDraftRecovery(actorKey, next)
            );
          setSnapshot(next);
        }
      ),
    [initial, actorKey]
  );
  useEffect(() => {
    controller.activate();
    if (actorKey) {
      watchDocumentationRecoveryAuth();
      activateDocumentationDraftRecovery(actorKey);
      const recovered = readDocumentationDraftRecovery(actorKey, initial);
      if (recovered) {
        controller.restore(recovered.edits, recovered.requireReview);
        if (!recovered.requireReview) void controller.flush();
      }
    }
    return () => {
      if (actorKey)
        saveDocumentationDraftRecovery(actorKey, controller.snapshot());
      controller.dispose();
    };
  }, [controller, initial, actorKey]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const current = controller.snapshot();
      if (actorKey) saveDocumentationDraftRecovery(actorKey, current);
      if (current.dirty) {
        event.preventDefault();
        // Legacy WebViews need returnValue as well as preventDefault to protect unsaved edits.
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Retain the documented beforeunload compatibility mechanism.
        event.returnValue = "";
      }
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    return () => globalThis.removeEventListener("beforeunload", beforeUnload);
  }, [controller, actorKey]);
  return { ...snapshot, controller, recoveryUnavailable };
}
