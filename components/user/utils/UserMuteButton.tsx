"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiIdentityMuteState } from "@/generated/models/ApiIdentityMuteState";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
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

export default function UserMuteButton({
  handle,
  buttonClassName,
  iconClassName,
}: {
  readonly handle: string;
  readonly buttonClassName: string;
  readonly iconClassName: string;
}) {
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
    void Promise.all([
      ...INVALIDATE_ON_MUTE_QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      ),
    ]).catch(() => undefined);
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

  const onMute = async (): Promise<void> => {
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

  const tooltipId = `mute-${identityKey || "profile"}`;
  const ariaLabel = isMuted
    ? t(locale, "profile.mute.action.unmuteAriaLabel")
    : t(locale, "profile.mute.action.muteAriaLabel");
  const buttonStateClass = isMuted
    ? "tw-bg-error/10 tw-text-error tw-ring-error/40 enabled:hover:tw-bg-error/15"
    : "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700 enabled:hover:tw-bg-iron-700 enabled:hover:tw-ring-iron-600";
  const statusText = isMuted
    ? t(locale, "profile.mute.status.muted")
    : t(locale, "profile.mute.status.unmuted");

  return (
    <>
      <button
        onClick={onMute}
        disabled={isPending}
        type="button"
        aria-label={ariaLabel}
        className={`${buttonClassName} ${buttonStateClass} tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out enabled:tw-cursor-pointer disabled:tw-cursor-default disabled:tw-opacity-70`}
        data-tooltip-id={tooltipId}
      >
        {isPending ? (
          <CircleLoader size={CircleLoaderSize.SMALL} />
        ) : (
          <FontAwesomeIcon
            icon={isMuted ? faBellSlash : faBell}
            className={iconClassName}
          />
        )}
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        delayShow={250}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        <span className="tw-text-xs">
          {isMuted
            ? t(locale, "profile.mute.action.unmute")
            : t(locale, "profile.mute.action.mute")}
        </span>
      </Tooltip>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {statusText}
      </span>
    </>
  );
}
