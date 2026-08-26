"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentityMuteState } from "@/generated/models/ApiIdentityMuteState";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

const INVALIDATE_ON_MUTE_QUERY_KEYS: QueryKey[] = [
  QueryKey.IDENTITY_NOTIFICATIONS,
  QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
  QueryKey.DM_DROPS_UNREAD,
  QueryKey.WAVES_OVERVIEW,
  QueryKey.WAVES_V2,
  QueryKey.OFFICIAL_WAVES,
];

export default function useProfileMute(handle: string) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const [authChecking, setAuthChecking] = useState(false);
  const mountedRef = useRef(true);
  const identityKey = handle.trim();
  const hasIdentityKey = identityKey.length > 0;
  const encodedIdentityKey = encodeURIComponent(identityKey);
  const identityMuteQueryKey = [
    QueryKey.IDENTITY_MUTE_STATE,
    identityKey,
  ] as const;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { data: identityMuteState, isFetching: isMuteStateFetching } =
    useQuery<ApiIdentityMuteState>({
      queryKey: identityMuteQueryKey,
      queryFn: async () =>
        await commonApiFetch<ApiIdentityMuteState>({
          endpoint: `/identities/${encodedIdentityKey}/mute`,
        }),
      enabled: hasIdentityKey,
    });

  const isMuted = !!identityMuteState?.muted;
  const isInitialMuteStatusLoading =
    isMuteStateFetching && identityMuteState === undefined;

  const invalidateMuteSideEffects = () => {
    void Promise.all(
      INVALIDATE_ON_MUTE_QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      )
    ).catch(() => undefined);
  };

  const muteMutation = useMutation({
    mutationFn: async (nextMuted: boolean): Promise<ApiIdentityMuteState> => {
      if (nextMuted) {
        return await commonApiPost<undefined, ApiIdentityMuteState>({
          endpoint: `/identities/${encodedIdentityKey}/mute`,
          body: undefined,
        });
      }

      await commonApiDelete({
        endpoint: `/identities/${encodedIdentityKey}/mute`,
      });
      return { muted: false };
    },
    onSuccess: (state) => {
      queryClient.setQueryData(identityMuteQueryKey, state);
      invalidateMuteSideEffects();
    },
  });

  const isPending =
    !hasIdentityKey ||
    authChecking ||
    muteMutation.isPending ||
    isInitialMuteStatusLoading;

  const toggleMute = async (): Promise<void> => {
    if (isPending) {
      return;
    }

    setAuthChecking(true);
    const nextMuted = !isMuted;
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }
      await muteMutation.mutateAsync(nextMuted);
    } catch (error) {
      if (mountedRef.current) {
        setToast({
          type: "error",
          title: t(
            locale,
            nextMuted ? "profile.mute.error.mute" : "profile.mute.error.unmute"
          ),
          description: t(locale, "profile.mute.error.description"),
          details: getToastErrorDetails(error),
        });
      }
    } finally {
      if (mountedRef.current) {
        setAuthChecking(false);
      }
    }
  };

  return { isMuted, isPending, toggleMute } as const;
}
