"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  CHAIN_RATING_ALLOWANCE_KEY,
  chainRatingTargetOf,
} from "@/components/chain-identity/useChainRatingAllowance";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiProfileRaterCicState } from "@/entities/IProfile";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { readRatingAllowance } from "@/lib/chain-identity/ratings";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import type { Hex } from "viem";

const isWallet = (value: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(value);

/**
 * The rater's NIC state for one profile. `profile`, when the caller has it,
 * lets the 6529 Network path find the profile's identity as the rating
 * writer does: by handle, checked against the profile's wallets.
 */
export function useNicRatingState(
  identity: string,
  enabled = true,
  profile?: ApiIdentity
) {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const chainActive = useChainIdentityActive();
  const rater = activeProfileProxy?.created_by.handle ?? address?.toLowerCase();
  const site = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: identity.toLowerCase(),
        rater,
      },
    ],
    queryFn: ({ signal }) => {
      if (rater === undefined) {
        throw new Error("Cannot fetch NIC rating without a rater");
      }
      return commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/rating/${rater}`,
        signal,
      });
    },
    enabled: enabled && !!address && !chainActive,
    staleTime: 0,
  });
  // On the 6529 Network the chain's numbers count: the rater's TDH less the
  // NIC it has given, and its NIC rating of this identity.
  const wallet = address?.toLowerCase() as Hex | undefined;
  const chain = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      ...CHAIN_RATING_ALLOWANCE_KEY,
      wallet,
      "NIC",
      identity.toLowerCase(),
    ],
    queryFn: async ({ signal }) => {
      const allowance = await readRatingAllowance(
        wallet as Hex,
        {
          matter: "NIC",
          target: profile
            ? chainRatingTargetOf(profile)
            : isWallet(identity)
              ? { wallets: [identity] }
              : { handle: identity },
          category: null,
        },
        signal
      );
      // Before the chain has counted the day's TDH it can't say what is
      // left; 6529.io's figure stands in, and the chain still checks.
      const left =
        allowance.available === null
          ? ((
              await commonApiFetch<ApiProfileRaterCicState>({
                endpoint: `profiles/${encodeURIComponent(identity)}/cic/rating/${wallet}`,
                signal,
              })
            ).cic_ratings_left_to_give_by_rater ?? null)
          : Number(allowance.available);
      return {
        cic_rating_by_rater: Number(allowance.current),
        cic_ratings_left_to_give_by_rater: left,
      };
    },
    enabled: enabled && wallet !== undefined && chainActive,
    staleTime: 5_000,
    retry: 1,
  });
  return chainActive ? chain : site;
}
