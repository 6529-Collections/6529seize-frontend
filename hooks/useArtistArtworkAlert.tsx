"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { CompactMenuItem } from "@/components/compact-menu";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import type { ApiArtistArtworkAlert } from "@/generated/models/ApiArtistArtworkAlert";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

export default function useArtistArtworkAlert(
  handle: string,
  scope: string,
  blocked: boolean,
  hasArtistActivity: boolean,
  loadPreference: boolean
): CompactMenuItem | null {
  const {
    connectedProfile,
    fetchingProfile,
    activeProfileProxy,
    isAuthenticated,
    isDirectProfileSession,
    requestAuth,
    setToast,
  } = useAuth();
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const canManage =
    !!connectedProfile?.id &&
    isAuthenticated === true &&
    isDirectProfileSession === true &&
    !activeProfileProxy;
  const queryKey = [QueryKey.ARTIST_ARTWORK_ALERT, scope, handle];
  const endpoint = `identities/${encodeURIComponent(handle)}/artwork-alerts`;
  const preference = useQuery<ApiArtistArtworkAlert>({
    queryKey,
    queryFn: ({ signal }) => commonApiFetch({ endpoint, signal }),
    enabled: canManage && loadPreference,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (enabled: boolean): Promise<ApiArtistArtworkAlert> => {
      const { success } = await requestAuth({
        expectedAuthStateFingerprint: getAuthStateFingerprint({
          walletAddress: getWalletAddress(),
          jwt: getAuthJwt(),
        }),
      });
      if (!success || !mounted.current)
        throw new Error(t(locale, "artworkAlerts.sessionChanged"));
      if (enabled)
        return commonApiPost<undefined, ApiArtistArtworkAlert>({
          endpoint,
          body: undefined,
        });
      await commonApiDelete({ endpoint });
      return { enabled: false };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      if (mounted.current)
        setToast({
          type: "success",
          message: t(
            locale,
            result.enabled ? "artworkAlerts.enabled" : "artworkAlerts.disabled"
          ),
        });
    },
    onError: (error) => {
      if (!mounted.current) return;
      setToast({
        type: "error",
        title: t(locale, "artworkAlerts.saveFailed"),
        description: t(locale, "artworkAlerts.tryAgain"),
        details: getToastErrorDetails(error),
      });
      // Read back after a lost response before offering another toggle, either
      // now or when the menu reopens.
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const enabled = canManage && preference.data?.enabled === true;
  if (!connectedProfile?.id || isAuthenticated !== true) return null;
  if (!hasArtistActivity && !enabled) return null;

  const loading =
    fetchingProfile ||
    (canManage && (preference.isPending || preference.isFetching));
  const failed = canManage && preference.isError;
  const savedStateLabel = t(
    locale,
    enabled ? "artworkAlerts.on" : "artworkAlerts.off"
  );
  let stateLabel = savedStateLabel;
  if (loading || mutation.isPending) {
    stateLabel = t(locale, "artworkAlerts.saving");
  } else if (failed) {
    stateLabel = t(locale, "artworkAlerts.retry");
  }
  const description = activeProfileProxy
    ? t(locale, "artworkAlerts.ownProfile")
    : t(locale, "artworkAlerts.mainStage");

  async function onClick() {
    if (!canManage) {
      await requestAuth();
      return;
    }
    if (failed) {
      await preference.refetch();
      return;
    }
    if (!preference.data || mutation.isPending) return;
    mutation.mutate(!enabled);
  }

  return {
    id: "artwork-alerts",
    label: (
      <span className="tw-block">
        <span className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span>{t(locale, "artworkAlerts.label")}</span>
          <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-text-xs tw-text-iron-400">
            {enabled && !failed && (
              <CheckIcon className="tw-size-3.5" aria-hidden="true" />
            )}
            {stateLabel}
          </span>
        </span>
        <span className="tw-mt-1 tw-block tw-text-balance tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
          {description}
        </span>
      </span>
    ),
    icon: <BellIcon className="tw-size-4" aria-hidden="true" />,
    disabled:
      !!activeProfileProxy ||
      (blocked && !enabled && !failed) ||
      loading ||
      mutation.isPending,
    onSelect: () => void onClick(),
    // A save must not depend on completion of a closing animation.
    deferUntilClosed: false,
  };
}
