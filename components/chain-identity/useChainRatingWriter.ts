"use client";

import { useContext, useMemo } from "react";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { writeChainRating } from "@/lib/chain-identity/ratings";

interface ChainRatingInput {
  readonly matter: "REP" | "NIC";
  readonly profile: ApiIdentity;
  readonly category: string | null;
  readonly amount: number;
}

type ChainRatingWriter = (input: ChainRatingInput) => Promise<void>;

/**
 * Writes REP and NIC on the 6529 Network once identities have moved there
 * and this build has the chain flows on; null before that, so 6529.io's own
 * rating requests run. Signs with this browser's session key when the
 * identity has one, else with the connected wallet.
 */
export function useChainRatingWriter(): ChainRatingWriter | null {
  const active = useChainIdentityActive();
  const config = useContext(WagmiContext);
  return useMemo(() => {
    if (!active || !config) {
      return null;
    }
    return async ({ matter, profile, category, amount }) => {
      const wallet = getAccount(config).address;
      if (!wallet) {
        throw new ChainOperationError(
          "signer_mismatch",
          "Connect your wallet to rate on the 6529 Network."
        );
      }
      await writeChainRating(config, wallet, {
        matter,
        target: {
          handle: profile.handle,
          wallets: [
            ...(profile.primary_wallet ? [profile.primary_wallet] : []),
            ...(profile.wallets ?? []).map((item) => item.wallet),
          ],
        },
        category: matter === "REP" ? category : null,
        value: BigInt(Math.trunc(amount)),
      });
    };
  }, [active, config]);
}
