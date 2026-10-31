"use client";

import { useEffect, useId, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  removeAllE2eeLocalData,
  removeE2eeProfileLocalData,
} from "@/lib/e2ee/local-data";
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

/**
 * Offers "Remove encrypted messages from this browser" on sign-out when this
 * browser holds encrypted messages: off by default for a normal sign-out,
 * on and explained for "sign out of all profiles". Removal runs before the
 * sign-out, so a failed removal leaves the user signed in to retry.
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

  useEffect(
    () =>
      registerE2eeSignOutHost(async (scope, signOut) => {
        if (!holdsMessages(scope, profileId)) {
          await signOut();
          return;
        }
        await new Promise<void>((resolve, reject) => {
          setRemove(scope === "all");
          setFailed(false);
          setRequest({ scope, profileId, signOut, resolve, reject });
        });
      }),
    [profileId]
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
              {t(
                locale,
                all ? "e2ee.signOut.remove.helpAll" : "e2ee.signOut.remove.help"
              )}
            </p>
          </div>
        </div>
        {failed ? (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
            {t(locale, "e2ee.signOut.removeFailed")}
          </p>
        ) : null}
      </div>
    </E2eeDialog>
  );
}
