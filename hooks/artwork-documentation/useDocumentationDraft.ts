"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  DocumentationDraftController,
  type DraftSnapshot,
} from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationContext,
  patchDocumentationModule,
} from "@/services/api/artwork-documentation-api";

/** Parent keys the editor by authenticated profile, proxy and wallet to discard private buffers on a switch. */
export function useDocumentationDraft(initial: ApiArtworkDocumentationContext) {
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
        setSnapshot
      ),
    [initial]
  );
  useEffect(() => {
    controller.activate();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (controller.snapshot().dirty) {
        event.preventDefault();
        // Legacy WebViews need returnValue as well as preventDefault to protect unsaved edits.
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Retain the documented beforeunload compatibility mechanism.
        event.returnValue = "";
      }
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    return () => globalThis.removeEventListener("beforeunload", beforeUnload);
  }, [controller]);
  return { ...snapshot, controller };
}
