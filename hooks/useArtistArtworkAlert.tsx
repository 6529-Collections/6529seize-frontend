"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
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
  blocked: boolean
): CompactMenuItem {
  const {
    connectedProfile,
    fetchingProfile,
    activeProfileProxy,
    isAuthenticated,
    isDirectProfileSession,
    requestAuth,
    setToast,
  } = useAuth();
  const { address, seizeConnect } = useSeizeConnectContext();
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
    enabled: canManage,
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
      // Read back after a lost response before offering another toggle.
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const enabled = canManage && preference.data?.enabled === true;
  const loading = fetchingProfile || (canManage && preference.isFetching);
  const failed = canManage && preference.isError;
  const label = t(
    locale,
    failed ? "artworkAlerts.retry" : "artworkAlerts.label"
  );
  const savedStateLabel = t(
    locale,
    enabled ? "artworkAlerts.on" : "artworkAlerts.off"
  );
  const stateLabel =
    loading || mutation.isPending
      ? t(locale, "artworkAlerts.saving")
      : savedStateLabel;
  const description = activeProfileProxy
    ? t(locale, "artworkAlerts.ownProfile")
    : t(locale, "artworkAlerts.mainStage");

  async function onClick() {
    if (!canManage) {
      if (!address) seizeConnect();
      else await requestAuth();
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
          <span>{label}</span>
          {!failed && (
            <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-iron-400">
              {enabled && (
                <CheckIcon className="tw-size-3.5" aria-hidden="true" />
              )}
              {stateLabel}
            </span>
          )}
        </span>
        <span className="tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
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
  };
}
