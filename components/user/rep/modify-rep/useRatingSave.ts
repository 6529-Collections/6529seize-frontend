"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useRef, useState } from "react";

type Matter = "REP" | "NIC";
interface RatingUpdate {
  readonly profile: ApiIdentity;
  readonly amount: number;
  readonly category?: string;
}

const COPY = {
  REP: {
    login: "rep.categories.edit.loginRequired",
    error: "rep.categories.edit.updateError",
    retry: "rep.categories.edit.tryAgain",
    updated: "rep.categories.edit.updated",
  },
  NIC: {
    login: "user.rate.loginRequired",
    error: "user.rate.updateError",
    retry: "user.rate.tryAgain",
    updated: "user.rate.updated",
  },
} as const;

function getRatingRequest(matter: Matter, update: RatingUpdate) {
  const identity =
    update.profile.query ?? update.profile.handle ?? update.profile.display;
  const body: { amount: number; category?: string } = { amount: update.amount };
  if (matter === "REP") {
    if (update.category === undefined)
      throw new Error("A REP adjustment requires an existing category");
    body.category = update.category;
  }
  return {
    endpoint: `profiles/${encodeURIComponent(identity)}/${matter === "REP" ? "rep" : "cic"}/rating`,
    body,
  };
}

/** One authenticated batch, ordered by the caller to release credit first. */
export function useRatingSave(matter: Matter, rater: string | null = null) {
  const locale = useBrowserLocale();
  const copy = COPY[matter];
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const { onProfileRepModify, onProfileCICModify } = useContext(
    ReactQueryWrapperContext
  );
  const lock = useRef(false);
  const mounted = useRef(false);
  const principal = `${connectedProfile?.id ?? ""}:${activeProfileProxy?.id ?? ""}`;
  const principalRef = useRef(principal);
  useEffect(() => {
    principalRef.current = principal;
  }, [principal]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCurrentSession = () =>
    mounted.current && principal === principalRef.current;
  const refresh = (targetProfiles: readonly ApiIdentity[]) => {
    const scope = {
      targetProfiles,
      connectedProfile,
      profileProxy: activeProfileProxy ?? null,
    };
    return matter === "REP"
      ? onProfileRepModify(scope)
      : onProfileCICModify({ ...scope, rater });
  };

  const save = async <Update extends RatingUpdate>(
    updates: readonly Update[],
    onSaved?: (update: Update) => void
  ): Promise<boolean> => {
    if (lock.current || updates.length === 0) return false;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    const savedProfiles = new Map<string, ApiIdentity>();
    try {
      const { success } = await requestAuth();
      if (!isCurrentSession()) return false;
      if (!success) {
        const message = t(locale, copy.login);
        setError(message);
        setToast({ message, type: "error" });
        return false;
      }
      // Sequential writes make released credit available to the next recipient.
      for (const update of updates) {
        if (!isCurrentSession()) return false;
        await commonApiPost(getRatingRequest(matter, update));
        savedProfiles.set(
          update.profile.id ?? update.profile.display,
          update.profile
        );
        onSaved?.(update);
      }
    } catch (cause) {
      const message = t(locale, copy.error);
      setError(message);
      setToast({
        type: "error",
        title: message,
        description: t(locale, copy.retry),
        details: getToastErrorDetails(cause),
      });
      return false;
    } finally {
      try {
        // Keep confirmed writes after a later failure and refresh once per batch.
        if (savedProfiles.size > 0) await refresh([...savedProfiles.values()]);
      } finally {
        lock.current = false;
        setIsSaving(false);
      }
    }
    if (!isCurrentSession()) return false;
    setToast({ message: t(locale, copy.updated, { matter }), type: "success" });
    return true;
  };
  return { save, isSaving, error, clearError: () => setError(null) };
}
