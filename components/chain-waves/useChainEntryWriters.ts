"use client";

import { useContext, useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Hex } from "viem";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { useCompetitionSignatureFor } from "@/hooks/competitions/useCompetitionSignature";
import { useChainWavesActive } from "@/hooks/useWavesMovePhase";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  competitionConsent,
  competitionEntryPayload,
  dropConsent,
  type EntryConsent,
  type EntryFields,
} from "@/lib/chain-waves/entryManifest";
import {
  writeChainEntry,
  writeChainWithdrawal,
  type ChainEntryReceipt,
  type ChainEntryStage,
} from "@/lib/chain-waves/entryWriters";
import { scheduleIndexRefresh } from "@/lib/chain-waves/optimistic";
import { invalidateCompetitionWave } from "@/services/api/competitions-api";

export interface ChainEntryWriters {
  /**
   * A create-drop request as an entry. `consent` returns the author's
   * signature over the entry and the terms, or null when none is asked.
   */
  readonly submitEntry: (input: {
    readonly request: ApiCreateDropRequest;
    readonly competitionId: string | null;
    readonly consent: (fields: EntryFields) => Promise<EntryConsent | null>;
    readonly onStage?: ((stage: ChainEntryStage) => void) | undefined;
  }) => Promise<ChainEntryReceipt>;
  /** Withdraws the viewer's own entry, the one a drop is. */
  readonly withdrawEntry: (input: { readonly dropId: string }) => Promise<void>;
}

/**
 * Entries and withdrawals on the 6529 Network once waves have moved there
 * and this build has the chain flows on; null before that, so 6529.io's
 * own requests run. The connected wallet signs each.
 */
export function useChainEntryWriters(): ChainEntryWriters | null {
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
      // Async, so a missing wallet or a proxy is a rejection, not a throw.
      submitEntry: async (input) =>
        writeChainEntry(config, connectedWallet(), input),
      withdrawEntry: async ({ dropId }) =>
        writeChainWithdrawal(config, connectedWallet(), { dropId }),
    };
  }, [active, activeProfileProxy, config]);
}

export type ChainEntrySubmit = (input: {
  readonly request: ApiCreateDropRequest;
  /** The terms the author accepted, for a wave without a competition. */
  readonly terms: string | null;
  /** Told when the wallet is asked to sign and when the entry is sent. */
  readonly onStage?: ((stage: ChainEntryStage) => void) | undefined;
}) => Promise<ChainEntryReceipt>;

/**
 * Submits an entry to the 6529 Network with the consent the wave asks for:
 * for a 6529.io competition, its ENTRY_CREATE signature when it requires
 * one (the wallet signs the terms first, then SUBMISSION_CREATE); else the
 * drop signature the composer already took. Null unless entries go to the
 * 6529 Network now.
 */
export function useChainEntrySubmit(
  competition: ApiCompetition | null
): ChainEntrySubmit | null {
  const writers = useChainEntryWriters();
  const sign = useCompetitionSignatureFor(competition);
  if (!writers) {
    return null;
  }
  return ({ request, terms, onStage }) =>
    writers.submitEntry({
      request,
      competitionId: competition?.id ?? null,
      onStage,
      consent: async (fields) => {
        if (!competition) {
          return dropConsent(request, terms);
        }
        if (!competition.participation.signature_required) {
          return null;
        }
        const signature = await sign(
          "ENTRY_CREATE",
          competitionEntryPayload(fields),
          null,
          null
        );
        return competitionConsent({
          signature,
          terms: competition.participation.terms ?? null,
          configVersion: competition.config_version,
          isSafeSignature: request.is_safe_signature ?? false,
        });
      },
    });
}

/**
 * Refreshes what a final entry or withdrawal changes: the wave's
 * leaderboard and decisions, and its drops; now, and again once 6529.io's
 * index has likely read the block, since it lists a native entry only
 * then.
 */
export async function invalidateChainEntryQueries(
  client: QueryClient,
  waveId: string
): Promise<void> {
  const refresh = () =>
    Promise.all([
      invalidateCompetitionWave(client, waveId),
      client.invalidateQueries({ queryKey: [QueryKey.DROPS, { waveId }] }),
      client.invalidateQueries({ queryKey: [QueryKey.DROPS_LEADERBOARD] }),
      client.invalidateQueries({ queryKey: [QueryKey.DROP] }),
    ]);
  scheduleIndexRefresh(refresh);
  await refresh();
}
