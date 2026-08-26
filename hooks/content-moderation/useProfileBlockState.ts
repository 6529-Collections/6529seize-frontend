"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiBlockedProfile } from "@/generated/models/ApiBlockedProfile";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  blockProfile,
  fetchBlockedProfiles,
  unblockProfile,
} from "@/services/api/content-moderation-api";
import {
  getProfileBlockedOverride,
  setProfileBlockedOverride,
  subscribeToContentModerationState,
} from "@/services/content-moderation/content-moderation-state";
import {
  BLOCKED_PROFILES_QUERY_KEY,
  invalidateContentModerationPresentation,
  reconcileIdentityFollowingAfterBlockChange,
} from "@/services/content-moderation/content-moderation-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

const useProfileBlockMutation = ({
  blocked,
  profileHandle,
  profileId,
  profilePfp,
  viewerProfileId,
}: {
  readonly blocked: boolean;
  readonly profileHandle: string | null | undefined;
  readonly profileId: string | null;
  readonly profilePfp: string | null | undefined;
  readonly viewerProfileId: string | null;
}) => {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [...BLOCKED_PROFILES_QUERY_KEY, viewerProfileId] as const;

  return useMutation({
    mutationFn: () => {
      if (!profileId) {
        return Promise.reject(new Error("Profile is unavailable"));
      }
      return blocked ? blockProfile(profileId) : unblockProfile(profileId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousProfiles =
        queryClient.getQueryData<ApiBlockedProfile[]>(queryKey);
      const previousBlocked =
        viewerProfileId && profileId
          ? getProfileBlockedOverride(viewerProfileId, profileId)
          : undefined;
      if (viewerProfileId && profileId) {
        setProfileBlockedOverride(viewerProfileId, profileId, blocked);
      }
      queryClient.setQueryData<ApiBlockedProfile[]>(queryKey, (current) => {
        if (!blocked) {
          return current?.filter((profile) => profile.profile_id !== profileId);
        }
        if (
          !profileId ||
          current?.some(({ profile_id }) => profile_id === profileId)
        ) {
          return current;
        }
        return [
          ...(current ?? []),
          {
            profile_id: profileId,
            blocked_at: Date.now(),
            ...(profileHandle === undefined ? {} : { handle: profileHandle }),
            ...(profilePfp === undefined ? {} : { pfp: profilePfp }),
          },
        ];
      });
      return { previousBlocked, previousProfiles, viewerProfileId };
    },
    onSuccess: () => {
      void reconcileIdentityFollowingAfterBlockChange(
        queryClient,
        profileHandle
      );
      void invalidateContentModerationPresentation(queryClient);
    },
    onError: (error, _variables, context) => {
      if (context?.viewerProfileId && profileId) {
        setProfileBlockedOverride(
          context.viewerProfileId,
          profileId,
          context.previousBlocked
        );
      }
      if (context?.previousProfiles) {
        queryClient.setQueryData(queryKey, context.previousProfiles);
      }
      setToast({
        type: "error",
        title: t(
          locale,
          blocked
            ? "contentModeration.block.error"
            : "contentModeration.unblock.error"
        ),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useProfileBlockState = ({
  profileId,
  profileHandle,
  profilePfp,
}: {
  readonly profileId: string | null;
  readonly profileHandle: string | null | undefined;
  readonly profilePfp?: string | null | undefined;
}) => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const viewerProfileId = connectedProfile?.id ?? null;
  const canLoad =
    viewerProfileId !== null &&
    profileId !== null &&
    viewerProfileId !== profileId &&
    activeProfileProxy === null;
  const queryKey = [...BLOCKED_PROFILES_QUERY_KEY, viewerProfileId] as const;
  const query = useQuery({
    queryKey,
    queryFn: fetchBlockedProfiles,
    enabled: canLoad,
    retry: false,
  });
  const getBlockedOverride = useCallback(() => {
    if (!viewerProfileId || !profileId) {
      return undefined;
    }
    return getProfileBlockedOverride(viewerProfileId, profileId);
  }, [profileId, viewerProfileId]);
  const blockedOverride = useSyncExternalStore(
    subscribeToContentModerationState,
    getBlockedOverride,
    () => undefined
  );
  const serverBlocked =
    profileId !== null &&
    (query.data?.some((profile) => profile.profile_id === profileId) ?? false);
  const isBlocked = canLoad && (blockedOverride ?? serverBlocked);
  const blockMutation = useProfileBlockMutation({
    blocked: true,
    profileHandle,
    profileId,
    profilePfp,
    viewerProfileId,
  });
  const unblockMutation = useProfileBlockMutation({
    blocked: false,
    profileHandle,
    profileId,
    profilePfp,
    viewerProfileId,
  });

  return {
    isBlocked,
    canManage: canLoad,
    isLoading: canLoad && query.isLoading && blockedOverride === undefined,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    block: blockMutation.mutateAsync,
    unblock: unblockMutation.mutateAsync,
  } as const;
};
