"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionResponse } from "@/generated/models/SubscriptionResponse";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NEXT_MINT_SUBSCRIPTION_QUERY_KEY = "next-mint-subscription";

interface SubscribeBody {
  contract: string;
  token_id: number;
  subscribed: boolean;
}

function getSubscriptionProfileKey(profile: ApiIdentity | null): string | null {
  if (!profile) {
    return null;
  }

  return profile.consolidation_key;
}

const fetchNextUpcomingSubscription = async (
  profileKey: string
): Promise<NFTSubscription | null> => {
  const subscriptions = await commonApiFetch<NFTSubscription[]>({
    endpoint: `subscriptions/consolidation/upcoming-memes/${profileKey}?card_count=1`,
  });

  return subscriptions[0] ?? null;
};

export function useNextMintSubscription(): {
  readonly nextSubscription: NFTSubscription | null;
  readonly isSubscribed: boolean;
  readonly isLoading: boolean;
  readonly isMutating: boolean;
  readonly canToggle: boolean;
  readonly toggleSubscription: () => Promise<void>;
} {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const queryClient = useQueryClient();
  const [isMutating, setIsMutating] = useState(false);
  const isMutatingRef = useRef(false);

  const profileKey = useMemo(
    () => getSubscriptionProfileKey(connectedProfile),
    [connectedProfile]
  );

  const canToggle = !!connectedProfile && !activeProfileProxy && !isMutating;
  const shouldQuery = !!profileKey && !activeProfileProxy;

  const { data, isLoading } = useQuery<NFTSubscription | null>({
    queryKey: [NEXT_MINT_SUBSCRIPTION_QUERY_KEY, profileKey],
    queryFn: async () => {
      if (!profileKey) {
        return null;
      }

      return await fetchNextUpcomingSubscription(profileKey);
    },
    enabled: shouldQuery,
    staleTime: 30000,
  });

  const toggleSubscription = useCallback(async (): Promise<void> => {
    if (isMutatingRef.current || activeProfileProxy) {
      return;
    }

    isMutatingRef.current = true;
    setIsMutating(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }

      const currentProfileKey = getSubscriptionProfileKey(connectedProfile);
      if (!currentProfileKey) {
        setToast({
          message: "Unable to find a connected profile for subscriptions.",
          type: "error",
        });
        return;
      }

      const targetSubscription =
        data ?? (await fetchNextUpcomingSubscription(currentProfileKey));

      if (!targetSubscription) {
        setToast({
          message: "No upcoming mint available to subscribe.",
          type: "warning",
        });
        return;
      }

      const subscribe = !targetSubscription.subscribed;
      const response = await commonApiPost<SubscribeBody, SubscriptionResponse>(
        {
          endpoint: `subscriptions/${currentProfileKey}/subscription`,
          body: {
            contract: targetSubscription.contract,
            token_id: targetSubscription.token_id,
            subscribed: subscribe,
          },
        }
      );

      setToast({
        message: `${response.subscribed ? "Subscribed for" : "Unsubscribed from"} The Memes #${
          response.token_id
        }`,
        type: "success",
      });

      await queryClient.invalidateQueries({
        queryKey: [NEXT_MINT_SUBSCRIPTION_QUERY_KEY, currentProfileKey],
      });
    } catch (error: unknown) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : "Failed to change token subscription.",
        type: "error",
      });
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  }, [
    activeProfileProxy,
    connectedProfile,
    data,
    queryClient,
    requestAuth,
    setToast,
  ]);

  return {
    nextSubscription: data ?? null,
    isSubscribed: !!data?.subscribed,
    isLoading,
    isMutating,
    canToggle,
    toggleSubscription,
  };
}
