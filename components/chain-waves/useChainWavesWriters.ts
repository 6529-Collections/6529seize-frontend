"use client";

import { useContext, useMemo } from "react";
import type { Hex } from "viem";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useAuth } from "@/components/auth/Auth";
import { formatFake6529 } from "@/components/chain-identity/chainAmount";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainWavesActive } from "@/hooks/useWavesMovePhase";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  writeChainPollBallot,
  writeChainVote,
  writeChainWaveRating,
} from "@/lib/chain-waves/writers";

interface ChainWavesWriters {
  /** The viewer's absolute vote on the entry a drop is. */
  readonly vote: (input: {
    readonly dropId: string;
    readonly amount: number;
  }) => Promise<void>;
  /** The viewer's ballot in a drop's poll, by 6529.io option numbers. */
  readonly pollBallot: (input: {
    readonly pollId: string;
    readonly optionNumbers: readonly number[];
  }) => Promise<void>;
  /** The viewer's wave REP for a wave and category. */
  readonly waveRating: (input: {
    readonly waveId: string;
    readonly category: string;
    readonly amount: number;
  }) => Promise<void>;
}

const integer = (value: number): bigint => BigInt(Math.trunc(value));

/**
 * Votes, poll ballots and wave REP on the 6529 Network once waves have moved
 * there and this build has the chain flows on; null before that, so
 * 6529.io's own requests run. Each signs with this browser's session key
 * when its grant covers the operation and the fee is within the key's cap,
 * else with the connected wallet; above the cap a toast says the fee before
 * the wallet asks.
 */
export function useChainWavesWriters(): ChainWavesWriters | null {
  const active = useChainWavesActive();
  const config = useContext(WagmiContext);
  const { activeProfileProxy, setToast } = useAuth();
  const locale = useBrowserLocale();
  return useMemo(() => {
    if (!active || !config) {
      return null;
    }
    const onWalletFee = (maxFee: bigint) =>
      setToast({
        message: t(locale, "chainIdentity.action.walletFee", {
          amount: formatFake6529(locale, maxFee, true),
        }),
        type: "warning",
      });
    const connectedWallet = (): Hex => {
      if (activeProfileProxy) {
        throw new ChainOperationError(
          "signer_mismatch",
          "A proxy can't act on the 6529 Network. Switch back to your own profile."
        );
      }
      const wallet = getAccount(config).address;
      if (!wallet) {
        throw new ChainOperationError(
          "signer_mismatch",
          "Connect your wallet to act on the 6529 Network."
        );
      }
      return wallet;
    };
    return {
      vote: ({ dropId, amount }) =>
        writeChainVote(config, connectedWallet(), {
          dropId,
          amount: integer(amount),
          onWalletFee,
        }),
      pollBallot: ({ pollId, optionNumbers }) =>
        writeChainPollBallot(config, connectedWallet(), {
          pollId,
          optionNumbers,
          onWalletFee,
        }),
      waveRating: ({ waveId, category, amount }) =>
        writeChainWaveRating(config, connectedWallet(), {
          waveId,
          category,
          value: integer(amount),
          onWalletFee,
        }),
    };
  }, [active, activeProfileProxy, config, locale, setToast]);
}
