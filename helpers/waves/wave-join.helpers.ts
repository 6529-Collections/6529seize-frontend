type WaveJoinCtaState = "hidden" | "sign-in" | "join" | "joined";

interface WaveJoinCtaStateInput {
  readonly isDirectMessage: boolean;
  readonly hasProfileHandle: boolean;
  readonly isProxy: boolean;
  readonly isSignedOut: boolean;
  readonly isJoined: boolean;
  readonly joinedHere: boolean;
}

/** How long the in-place "Joined" confirmation stays before settling. */
export const JOIN_CONFIRMATION_MS = 4000;

/**
 * Who sees the wave header Join call to action:
 * - DMs and proxy sessions never do (DM membership is fixed; proxies cannot join).
 * - Signed-in profiles see Join until they are members, then nothing, except
 *   for a brief "Joined" confirmation right after joining from this control.
 * - Signed-out visitors see Join, which opens the existing connect flow.
 * - Connected wallets without a resolved profile see nothing until the
 *   profile loads, so the control never flashes the wrong state.
 */
export function getWaveJoinCtaState({
  isDirectMessage,
  hasProfileHandle,
  isProxy,
  isSignedOut,
  isJoined,
  joinedHere,
}: WaveJoinCtaStateInput): WaveJoinCtaState {
  if (isDirectMessage || isProxy) {
    return "hidden";
  }
  if (hasProfileHandle) {
    if (!isJoined) {
      return "join";
    }
    return joinedHere ? "joined" : "hidden";
  }
  return isSignedOut ? "sign-in" : "hidden";
}
