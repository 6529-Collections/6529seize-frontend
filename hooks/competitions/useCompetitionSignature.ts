"use client";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { useSignMessage } from "wagmi";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { buildCompetitionSignatureMessage } from "@/services/wallet-signatures/competition-signature";
import type { ApiCompetitionSignature } from "@/generated/models/ApiCompetitionSignature";
import { useCompetition } from "@/contexts/CompetitionContext";
import { buildDecisionSignatureContext } from "@/lib/desktop/walletRequestContext";
import { rememberWalletRequestContext } from "@/services/desktop/walletRequestContexts";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import type { MessageKey } from "@/i18n/messages";

/**
 * Why the wallet signature a decision asks for was not made: no wallet is
 * connected in this window, the wallet declined, or the wallet failed.
 */
class CompetitionSignatureError extends Error {
  readonly reason: "walletNotConnected" | "rejected" | "failed";

  constructor(
    reason: CompetitionSignatureError["reason"],
    options?: { cause?: unknown }
  ) {
    super(
      reason === "walletNotConnected"
        ? "A connected wallet is required"
        : "The wallet did not sign the request",
      options
    );
    this.name = "CompetitionSignatureError";
    this.reason = reason;
  }
}

const SIGNATURE_FAILURE_KEYS = {
  walletNotConnected: "competitions.signatureWalletRequired",
  rejected: "competitions.signatureCancelled",
  failed: "competitions.signatureFailed",
} as const satisfies Record<CompetitionSignatureError["reason"], MessageKey>;

/**
 * Marks an error thrown while signing as a signature-step failure. Forms that
 * show their own message wrap only their `sign` call; other callers keep the
 * wallet's original error.
 */
export function toCompetitionSignatureError(
  error: unknown
): CompetitionSignatureError {
  if (error instanceof CompetitionSignatureError) return error;
  return new CompetitionSignatureError(
    isUserRejectedSigningError(error) ? "rejected" : "failed",
    { cause: error }
  );
}

/** The message for a failed signature step, or null for any other failure. */
export function getCompetitionSignatureFailureKey(
  error: unknown
): MessageKey | null {
  return error instanceof CompetitionSignatureError
    ? SIGNATURE_FAILURE_KEYS[error.reason]
    : null;
}

export function useCompetitionSignature() {
  const { competition } = useCompetition();
  return useCompetitionSignatureFor(competition);
}

export function useCompetitionSignatureFor(competition: ApiCompetition | null) {
  const { signMessageAsync } = useSignMessage();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  return async (
    action: "ENTRY_CREATE" | "VOTE_SET",
    payload: unknown,
    entryId: string | null,
    dropId: string | null
  ): Promise<ApiCompetitionSignature> => {
    if (!competition)
      throw new Error("Competition signature scope is required");
    if (!connectedProfile?.id || !address)
      throw new CompetitionSignatureError("walletNotConnected");
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
    // 6529 Desktop: lets the browser page show what the hash covers.
    rememberWalletRequestContext(message, () =>
      buildDecisionSignatureContext(payload)
    );
    return { message, signature: await signMessageAsync({ message }) };
  };
}
