"use client";

import { useContext, useMemo } from "react";
import type { Hex } from "viem";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useAuth } from "@/components/auth/Auth";
import { useChainWavesActive } from "@/hooks/useWavesMovePhase";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  writeChainPollBallot,
  writeChainVote,
  writeChainWaveRating,
} from "@/lib/chain-waves/writers";

export interface ChainWavesWriters {
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
 * when its grant covers the operation, else with the connected wallet.
 */
export function useChainWavesWriters(): ChainWavesWriters | null {
  const active = useChainWavesActive();
  const config = useContext(WagmiContext);
  const { activeProfileProxy } = useAuth();
  return useMemo(() => {
    if (!active || !config) {
      return null;
    }
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
        }),
      pollBallot: ({ pollId, optionNumbers }) =>
        writeChainPollBallot(config, connectedWallet(), {
          pollId,
          optionNumbers,
        }),
      waveRating: ({ waveId, category, amount }) =>
        writeChainWaveRating(config, connectedWallet(), {
          waveId,
          category,
          value: integer(amount),
        }),
    };
  }, [active, activeProfileProxy, config]);
}
