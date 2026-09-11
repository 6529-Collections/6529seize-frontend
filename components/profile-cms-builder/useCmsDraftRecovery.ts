"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  CmsDraftRecoveryController,
  EMPTY_CMS_RECOVERY,
} from "@/lib/profile-cms/builder/recovery";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

export function useCmsDraftRecovery({
  scope,
  enabled,
  cmsPackage,
  draftId,
  jsonDraft,
  dirty,
  busy,
  leaveMessage,
}: {
  readonly scope: string;
  readonly enabled: boolean;
  readonly cmsPackage: CmsPackageV1;
  readonly draftId?: string | undefined;
  readonly jsonDraft: string | undefined;
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly leaveMessage: string;
}) {
  const handle = cmsPackage.profile.handle.toLowerCase();
  const controller = useMemo(
    () =>
      new CmsDraftRecoveryController(
        `profile-cms-recovery-v1:${scope}`,
        handle
      ),
    [scope, handle]
  );
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => EMPTY_CMS_RECOVERY
  );
  // Synchronize browser storage, an external store; this does not notify a parent component.
  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
    if (enabled) controller.load();
  }, [controller, enabled]);
  // Persist the current draft to browser storage after React commits its state.
  useEffect(() => {
    if (enabled)
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
      controller.save(dirty ? { cmsPackage, draftId, jsonDraft } : null);
  }, [
    controller,
    enabled,
    cmsPackage,
    draftId,
    jsonDraft,
    dirty,
    snapshot.recovery,
  ]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older embedded WebViews still require the compatibility property.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.returnValue = "";
    };
    const beforeLink = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.download ||
        anchor.href === globalThis.location.href
      )
        return;
      // Capture navigation synchronously before Next handles the anchor click.
      // eslint-disable-next-line no-alert
      if (!globalThis.confirm(leaveMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    globalThis.document.addEventListener("click", beforeLink, true);
    return () => {
      globalThis.removeEventListener("beforeunload", beforeUnload);
      globalThis.document.removeEventListener("click", beforeLink, true);
    };
  }, [busy, dirty, leaveMessage]);
  return { ...snapshot, dismissRecovery: () => controller.dismiss() };
}
