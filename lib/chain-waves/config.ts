import { publicEnv } from "@/config/env";
import { getChainGatewayUrl } from "@/lib/chain-identity/config";
import {
  isWavesWritePausedPhase,
  type WavesMovePhase,
} from "@/lib/waves-move/schedule";

/**
 * Whether this build sends waves writes to the 6529 Network through the
 * gateway once waves have moved there. On only when
 * NEXT_PUBLIC_FEATURE_CHAIN_WAVES is exactly "true", a gateway is set, and
 * NEXT_PUBLIC_CHAIN_NETWORK_ID names the network, so every draft is checked
 * against it before anything is signed.
 */
export function isChainWavesEnabled(): boolean {
  return (
    publicEnv.NEXT_PUBLIC_FEATURE_CHAIN_WAVES === "true" &&
    getChainGatewayUrl() !== null &&
    (publicEnv.NEXT_PUBLIC_CHAIN_NETWORK_ID?.trim() ?? "") !== ""
  );
}

/**
 * The writes that go through the 6529 Network once waves have moved, each
 * opened by the change that sends it there: votes, poll ballots and wave REP;
 * entries and their withdrawal; and wave, group, role and decision settings
 * with pauses and moderation.
 */
export type WavesChainWrite =
  | "votes"
  | "polls"
  | "waveRep"
  | "entries"
  | "settings"
  | "decisions";

/**
 * Whether a write is closed in `phase`: paused for the move, with no chain
 * path for it. Without `kind` (a write not yet sent to the 6529 Network,
 * such as new polls) every paused phase closes it.
 */
export function isWavesWriteClosed(
  phase: WavesMovePhase,
  kind?: WavesChainWrite
): boolean {
  if (!isWavesWritePausedPhase(phase)) {
    return false;
  }
  return !(kind !== undefined && phase === "moved" && isChainWavesEnabled());
}
