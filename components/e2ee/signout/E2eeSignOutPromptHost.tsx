"use client";

import { useEffect, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import {
  removeAllE2eeLocalData,
  removeE2eeProfileLocalData,
} from "@/lib/e2ee/local-data";
import type { E2eeEngine } from "@/lib/e2ee/types";
import { useE2eeContext } from "../E2eeContext";
import {
  clearE2eeLocalMarkers,
  hasAnyE2eeEnrollmentMarker,
  hasE2eeEnrollmentMarker,
} from "../e2eeLocalState";
import { E2eeDialog } from "../ui/E2eeDialog";
import { type E2eeSignOutScope, registerE2eeSignOutHost } from "./e2eeSignOut";

interface PendingSignOut {
  readonly scope: E2eeSignOutScope;
  readonly profileId: string | null;
  readonly signOut: () => void | Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

interface E2eeSignOutPromptHostProps {
  /** The signed-in profile (null when signed out or acting as a proxy). */
  readonly profileId: string | null;
  /** Stops this tab's engines before their data is deleted. */
  readonly releaseEngines: () => Promise<void>;
}

const holdsMessages = (
  scope: E2eeSignOutScope,
  profileId: string | null
): boolean =>
  scope === "all"
    ? hasAnyE2eeEnrollmentMarker()
    : profileId !== null && hasE2eeEnrollmentMarker(profileId);

async function removeLocalData(
  scope: E2eeSignOutScope,
  profileId: string | null
): Promise<void> {
  if (scope === "all") {
    await removeAllE2eeLocalData();
    clearE2eeLocalMarkers(null);
    return;
  }
  if (profileId !== null) {
    await removeE2eeProfileLocalData(profileId);
    clearE2eeLocalMarkers(profileId);
  }
}

/** How long sign-out waits for the backup update or the device removal. */
const STEP_TIMEOUT_MS = 30_000;

/** Resolves true when `task` finished in time, false when it failed or timed out. */
async function settlesInTime(task: () => Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), STEP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      task().then(
        () => true,
        () => false
      ),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * True when the encrypted backup is on, fully uploaded and its last run
 * succeeded: removing this browser's copy then loses nothing that the
 * recovery code cannot restore (sign-out still uploads the latest changes
 * first).
 */
const isBackupCurrent = (snapshot: E2eeBackupSnapshot | null): boolean =>
  snapshot?.phase === "on" &&
  !snapshot.uploading &&
  snapshot.lastError === null &&
  snapshot.lastBackupAt !== null;

/**
 * Removes this device from the profile's encrypted chats before its keys
 * are deleted, so other members stop encrypting to it. Best effort: an
 * engine that is not ready, a network failure or a slow server never
 * blocks the sign-out.
 */
async function revokeThisDevice(engine: E2eeEngine | null): Promise<void> {
  const device =
    engine?.getStatus() === "ready" ? engine.getThisDevice() : null;
  if (!engine || !device) {
    return;
  }
  if (!(await settlesInTime(() => engine.revokeDevice(device.deviceKey)))) {
    console.warn("Could not remove this device from encrypted chats");
  }
}

function removeHelpKey(scope: E2eeSignOutScope, backedUp: boolean): MessageKey {
  if (scope === "all") {
    return "e2ee.signOut.remove.helpAll";
  }
  return backedUp
    ? "e2ee.signOut.remove.helpBackedUp"
    : "e2ee.signOut.remove.help";
}

/**
 * Offers "Remove encrypted messages from this browser" on sign-out when this
 * browser holds encrypted messages. For a normal sign-out it is on by
 * default only when the encrypted backup is current (nothing would be lost)
 * and off otherwise; for "sign out of all profiles" it is on and explained.
 * Removal uploads the latest changes to the backup, removes this device
 * from the profile's encrypted chats, then deletes the local data, all
 * before the sign-out, so a failed removal leaves the user signed in.
 */
export function E2eeSignOutPromptHost({
  profileId,
  releaseEngines,
}: E2eeSignOutPromptHostProps) {
  const locale = useBrowserLocale();
  const checkboxId = useId();
  const helpId = useId();
  const [request, setRequest] = useState<PendingSignOut | null>(null);
  const [remove, setRemove] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  /** The backup update failed once: the next confirm removes without it. */
  const [backupFailed, setBackupFailed] = useState(false);
  const context = useE2eeContext();
  const ownEngine = context.profileId === profileId ? context : null;
  const engine: E2eeEngine | null = ownEngine?.engine ?? null;
  const backup: E2eeBackupManager | null = ownEngine?.backup ?? null;

  useEffect(
    () =>
      registerE2eeSignOutHost(async (scope, signOut) => {
        if (!holdsMessages(scope, profileId)) {
          await signOut();
          return;
        }
        const current = isBackupCurrent(backup?.getSnapshot() ?? null);
        await new Promise<void>((resolve, reject) => {
          setRemove(scope === "all" || current);
          setBackedUp(current);
          setFailed(false);
          setBackupFailed(false);
          setRequest({ scope, profileId, signOut, resolve, reject });
        });
      }),
    [backup, profileId]
  );

  const cancel = () => {
    if (pending || !request) {
      return;
    }
    setRequest(null);
    request.resolve();
  };

  const confirm = async () => {
    if (!request) {
      return;
    }
    setPending(true);
    setFailed(false);
    if (remove) {
      const flush =
        backup && !backupFailed && backup.getSnapshot().phase === "on";
      if (flush && !(await settlesInTime(() => backup.backupNow()))) {
        // Keep the messages unless the user asks again knowing the backup
        // may be missing the latest ones.
        setPending(false);
        setRemove(false);
        setBackupFailed(true);
        return;
      }
      await revokeThisDevice(engine);
      try {
        await releaseEngines();
        await removeLocalData(request.scope, request.profileId);
      } catch (error) {
        console.error("Failed to remove encrypted messages", error);
        setPending(false);
        setFailed(true);
        return;
      }
    }
    setPending(false);
    setRequest(null);
    try {
      await request.signOut();
      request.resolve();
    } catch (error) {
      request.reject(error);
    }
  };

  const all = request?.scope === "all";
  return (
    <E2eeDialog
      open={request !== null}
      onClose={cancel}
      title={t(locale, all ? "e2ee.signOut.titleAll" : "e2ee.signOut.title")}
      description={t(locale, "e2ee.signOut.body")}
      closeLabel={t(locale, "e2ee.action.close")}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={cancel}
            disabled={pending}
          >
            {t(locale, "e2ee.action.cancel")}
          </Button>
          <Button
            variant={remove ? "destructive" : "action"}
            size="md"
            onClick={() => void confirm()}
            loading={pending}
          >
            {t(locale, "e2ee.signOut.confirm")}
          </Button>
        </>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div
          className={
            all
              ? "tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/40 tw-bg-amber-500/10 tw-p-3"
              : "tw-flex tw-items-start tw-gap-3"
          }
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={remove}
            disabled={pending}
            aria-describedby={helpId}
            onChange={(event) => setRemove(event.target.checked)}
            className="tw-mt-1 tw-size-4 tw-flex-shrink-0 tw-accent-primary-500"
          />
          <div className="tw-flex tw-flex-col tw-gap-1">
            <label
              htmlFor={checkboxId}
              className="tw-text-sm tw-font-medium tw-text-iron-100"
            >
              {t(locale, "e2ee.signOut.remove.label")}
            </label>
            <p id={helpId} className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, removeHelpKey(request?.scope ?? "profile", backedUp))}
            </p>
          </div>
        </div>
        {backupFailed ? (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-amber-300">
            {t(locale, "e2ee.signOut.backupFailed")}
          </p>
        ) : null}
        {failed ? (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
            {t(locale, "e2ee.signOut.removeFailed")}
          </p>
        ) : null}
      </div>
    </E2eeDialog>
  );
}
