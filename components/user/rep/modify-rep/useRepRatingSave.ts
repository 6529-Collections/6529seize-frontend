"use client";

import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";

export interface RepRatingUpdate {
  readonly profile: ApiIdentity;
  readonly category: string;
  readonly amount: number;
}

/** Shared by category editing and Manage given. Each successful write refreshes its caches. */
export function useRepRatingSave() {
  const locale = useBrowserLocale();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();
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

  const save = async (
    updates: readonly RepRatingUpdate[],
    onSaved?: (update: RepRatingUpdate) => void
  ): Promise<boolean> => {
    if (lock.current || updates.length === 0) return false;
    lock.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const { success } = await requestAuth();
      if (!isCurrentSession()) return false;
      if (!success) {
        const message = t(locale, "rep.categories.edit.loginRequired");
        setError(message);
        setToast({ message, type: "error" });
        return false;
      }
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
        onProfileRepModify({
          targetProfile: update.profile,
          connectedProfile,
          profileProxy: activeProfileProxy ?? null,
        });
        onSaved?.(update);
      }
      await queryClient.refetchQueries(
        { queryKey: [QueryKey.PROFILE_REP_RATINGS], type: "active" },
        { cancelRefetch: false }
      );
      setToast({
        message: t(locale, "rep.categories.edit.updated"),
        type: "success",
      });
      return true;
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
      lock.current = false;
      setIsSaving(false);
    }
  };
  return { save, isSaving, error, clearError: () => setError(null) };
}
