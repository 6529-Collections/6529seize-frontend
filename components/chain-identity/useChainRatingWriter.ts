"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { writeChainRating } from "@/lib/chain-identity/ratings";
import { formatFake6529 } from "./chainAmount";
import {
  CHAIN_RATING_ALLOWANCE_KEY,
  chainRatingTargetOf,
} from "./useChainRatingAllowance";

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
 * identity has one and the fee is within its cap, else with the connected
 * wallet; above the cap a toast says the fee before the wallet asks. Each
 * write, done or not, refreshes what the forms show as left to give.
 */
export function useChainRatingWriter(): ChainRatingWriter | null {
  const active = useChainIdentityActive();
  const config = useContext(WagmiContext);
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  return useMemo(() => {
    if (!active || !config) {
      return null;
    }
    return async ({ matter, profile, category, amount }) => {
      const wallet = getAccount(config).address;
      if (!wallet) {
        throw new ChainOperationError(
          "signer_mismatch",
          "Connect your wallet to rate on the 6529 Network.",
          "NO_WALLET"
        );
      }
      try {
        await writeChainRating(config, wallet, {
          matter,
          target: chainRatingTargetOf(profile),
          category: matter === "REP" ? category : null,
          value: BigInt(Math.trunc(amount)),
          onWalletFee: (maxFee) =>
            setToast({
              message: t(locale, "chainIdentity.rating.walletFee", {
                amount: formatFake6529(locale, maxFee, true),
              }),
              type: "warning",
            }),
        });
      } finally {
        void queryClient.invalidateQueries({
          queryKey: CHAIN_RATING_ALLOWANCE_KEY,
        });
      }
    };
  }, [active, config, queryClient, locale, setToast]);
}
