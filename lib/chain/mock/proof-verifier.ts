/**
 * A `ProofVerifier` for the mock chain, standing in for the light client
 * of P41 §5.4 in tests. It accepts only evidence the given mock chain
 * issued and checks it against that chain's own record, so the ladder's
 * verified path (Committed, Finalized, In decision D) can be exercised.
 * It proves nothing about any real network and must never be wired into
 * production code.
 */
import type { Hex } from "viem";

import type {
  ChainEvidence,
  DecisionClaim,
  IncludedLocation,
  ProofVerifier,
} from "../gateway/transport";
import { MOCK_EVIDENCE_KIND, type MockChain } from "./chain";

function payloadOf(evidence: ChainEvidence | null, chain: MockChain): Readonly<Record<string, unknown>> | null {
  if (evidence?.kind !== MOCK_EVIDENCE_KIND) {
    return null;
  }
  const payload = evidence.payload;
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const record = payload as Readonly<Record<string, unknown>>;
  return record["instance"] === chain.instance ? record : null;
}

function inclusionMatches(chain: MockChain, txId: Hex, location: IncludedLocation): boolean {
  const payload = payloadOf(location.evidence, chain);
  const truth = chain.locate(txId);
  return (
    payload !== null &&
    payload["txId"] === txId.toLowerCase() &&
    truth.status === "included" &&
    truth.height === location.height &&
    truth.index === location.index
  );
}

export function createMockProofVerifier(chain: MockChain): ProofVerifier {
  return {
    verifyInclusion(txId: Hex, location: IncludedLocation): Promise<boolean> {
      return Promise.resolve(inclusionMatches(chain, txId, location));
    },
    verifyResult(txId: Hex, location: IncludedLocation): Promise<boolean> {
      const truth = chain.locate(txId);
      // Finalized needs header h+1 (P41 §5.3): one more block must exist.
      return Promise.resolve(
        inclusionMatches(chain, txId, location) &&
          truth.status === "included" &&
          truth.code === location.code &&
          chain.head().height > location.height
      );
    },
    verifyDecision(txId: Hex, claim: DecisionClaim): Promise<boolean> {
      const payload = payloadOf(claim.evidence, chain);
      const truth = chain.locate(txId);
      return Promise.resolve(
        payload !== null &&
          truth.status === "included" &&
          truth.decision?.decisionId === claim.decisionId &&
          truth.decision.decisionTimeMs === claim.decisionTimeMs
      );
    },
  };
}
