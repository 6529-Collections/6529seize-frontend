"use client";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { useSignMessage } from "wagmi";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { buildCompetitionSignatureMessage } from "@/services/wallet-signatures/competition-signature";
import type { ApiCompetitionSignature } from "@/generated/models/ApiCompetitionSignature";
import { useCompetition } from "@/contexts/CompetitionContext";

export function useCompetitionSignature() {
  const { competition } = useCompetition();
  return useCompetitionSignatureFor(competition);
}

export function useCompetitionSignatureFor(competition: ApiCompetition) {
  const { signMessageAsync } = useSignMessage();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  return async (
    action: "ENTRY_CREATE" | "VOTE_SET",
    payload: unknown,
    entryId: string | null,
    dropId: string | null
  ): Promise<ApiCompetitionSignature> => {
    if (!connectedProfile?.id || !address)
      throw new Error("A connected wallet is required");
    const message = buildCompetitionSignatureMessage({
      action,
      actorProfileId: activeProfileProxy?.created_by.id ?? connectedProfile.id,
      actorWallet: address,
      waveId: competition.wave_id,
      competitionId: competition.id,
      entryId,
      dropId,
      configVersion: competition.config_version,
      payload,
      nonce: globalThis.crypto.randomUUID(),
      issuedAt: Date.now(),
    });
    return { message, signature: await signMessageAsync({ message }) };
  };
}
