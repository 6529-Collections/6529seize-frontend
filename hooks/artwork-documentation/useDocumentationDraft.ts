"use client";

import { useEffect, useReducer, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
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
  const [, redraw] = useReducer((revision: number) => revision + 1, 0);
  const createBinding = () => ({
    actorKey,
    seed: initial,
    controller: new DocumentationDraftController(
      initial,
      { save: patchDocumentationModule, read: getDocumentationContext },
      (next) => {
        if (actorKey)
          setRecoveryUnavailable(
            !saveDocumentationDraftRecovery(actorKey, next)
          );
        redraw();
      }
    ),
  });
  const [binding, setBinding] = useState(createBinding);
  if (
    binding.actorKey !== actorKey ||
    binding.seed.id !== initial.id ||
    binding.seed.work_id !== initial.work_id
  ) {
    setBinding(createBinding());
    setRecoveryUnavailable(false);
  }
  const { controller, seed } = binding;
  useEffect(() => {
    controller.activate();
    if (actorKey) {
      watchDocumentationRecoveryAuth();
      activateDocumentationDraftRecovery(actorKey);
      const recovered = readDocumentationDraftRecovery(actorKey, seed);
      if (recovered) {
        // Restoring an imperative save queue is external synchronization, not parent state propagation.
        // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-live-state-to-parent
        controller.restore(recovered.edits, recovered.requireReview);
        if (!recovered.requireReview) void controller.flush();
      }
    }
    return () => {
      if (actorKey)
        saveDocumentationDraftRecovery(actorKey, controller.snapshot());
      controller.dispose();
    };
  }, [controller, seed, actorKey]);
  useEffect(() => {
    // Reconcile an external save queue after commit; render must not abort requests or notify subscribers.
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-chain-state-updates, react-you-might-not-need-an-effect/no-derived-state
    controller.receiveContext(initial);
  }, [controller, initial]);
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
  return { ...controller.snapshot(), controller, recoveryUnavailable };
}
