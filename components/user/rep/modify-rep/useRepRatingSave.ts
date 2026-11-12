"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useRef, useState } from "react";

interface RepRatingUpdate {
  readonly profile: ApiIdentity;
  readonly category: string;
  readonly amount: number;
}

/** Shared by category editing and All receivers. Refresh successful writes once per batch. */
export function useRepRatingSave() {
  const locale = useBrowserLocale();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
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

  const save = async <Update extends RepRatingUpdate>(
    updates: readonly Update[],
    onSaved?: (update: Update) => void
  ): Promise<boolean> => {
    if (lock.current || updates.length === 0) return false;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    const savedProfiles: ApiIdentity[] = [];
    try {
      const { success } = await requestAuth();
      if (!isCurrentSession()) return false;
      if (!success) {
        const message = t(locale, "rep.categories.edit.loginRequired");
        setError(message);
        setToast({ message, type: "error" });
        return false;
      }
      // Writes are sequential: category batches release credit before spending it.
      for (const update of updates) {
        if (!isCurrentSession()) return false;
        const identity =
          update.profile.query ??
          update.profile.handle ??
          update.profile.display;
        await commonApiPost<{ amount: number; category: string }, void>({
          endpoint: `profiles/${encodeURIComponent(identity)}/rep/rating`,
          body: { amount: update.amount, category: update.category },
        });
        savedProfiles.push(update.profile);
        onSaved?.(update);
      }
    } catch (cause) {
      const message = t(locale, "rep.categories.edit.updateError");
      setError(message);
      setToast({
        type: "error",
        title: message,
        description: t(locale, "rep.categories.edit.tryAgain"),
        details: getToastErrorDetails(cause),
      });
      return false;
    } finally {
      try {
        // A failed later write must still refresh the successful recipients
        // and the shared credit budget before the remaining edits can retry.
        if (savedProfiles.length > 0) {
          await onProfileRepModify({
            targetProfiles: savedProfiles,
            connectedProfile,
            profileProxy: activeProfileProxy ?? null,
          });
        }
      } finally {
        lock.current = false;
        setIsSaving(false);
      }
    }
    if (!isCurrentSession()) return false;
    setToast({
      message: t(locale, "rep.categories.edit.updated"),
      type: "success",
    });
    return true;
  };
  return { save, isSaving, error, clearError: () => setError(null) };
}
