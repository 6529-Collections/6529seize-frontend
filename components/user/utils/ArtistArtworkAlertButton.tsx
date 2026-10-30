"use client";

import { useEffect, useId, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import type { ApiArtistArtworkAlert } from "@/generated/models/ApiArtistArtworkAlert";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

type Props = Readonly<{
  handle: string;
  blocked: boolean;
  blockStateLoading: boolean;
}>;

export default function ArtistArtworkAlertButton(props: Props) {
  const auth = useAuth();
  const scope = `${auth.connectedProfile?.id ?? "guest"}:${auth.activeProfileProxy?.id ?? "direct"}:${auth.isAuthenticated === true}:${auth.isDirectProfileSession === true}`;
  return (
    <ArtistArtworkAlertControl
      key={`${scope}:${props.handle}`}
      {...props}
      scope={scope}
    />
  );
}

function ArtistArtworkAlertControl({
  handle,
  blocked,
  blockStateLoading,
  scope,
}: Props & { readonly scope: string }) {
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
  const tooltipId = useId();
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
  const label = failed
    ? t(locale, "artworkAlerts.retry")
    : t(locale, "artworkAlerts.label");
  const toggleDescription = t(
    locale,
    enabled ? "artworkAlerts.turnOff" : "artworkAlerts.mainStage"
  );
  const description = activeProfileProxy
    ? t(locale, "artworkAlerts.ownProfile")
    : toggleDescription;

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

  return (
    <>
      <Button
        size="sm"
        variant="positiveToggle"
        aria-pressed={enabled}
        aria-label={failed ? label : t(locale, "artworkAlerts.accessibleName")}
        aria-describedby={`${tooltipId}-description`}
        disabled={
          !!activeProfileProxy ||
          blockStateLoading ||
          (blocked && !enabled) ||
          loading ||
          mutation.isPending
        }
        loading={loading || mutation.isPending}
        onClick={() => void onClick()}
        data-tooltip-id={tooltipId}
      >
        {!loading && !mutation.isPending && (
          <BellIcon className="tw-size-4" aria-hidden="true" />
        )}
        <span>{label}</span>
        {enabled && <CheckIcon className="tw-size-3.5" aria-hidden="true" />}
      </Button>
      <span id={`${tooltipId}-description`} className="tw-sr-only">
        {description}
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
        delayShow={250}
      >
        {description}
      </Tooltip>
    </>
  );
}
