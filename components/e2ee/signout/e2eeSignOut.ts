/**
 * Sign-out hook for encrypted messages. The header's sign-out buttons run
 * their action through `signOutWithE2eeChoice`; when encrypted messages are on
 * and this browser holds them, the provider's prompt first offers to remove
 * them. Otherwise it is the plain sign-out, unchanged.
 */

export type E2eeSignOutScope = "profile" | "all";

type SignOut = () => void | Promise<void>;

type SignOutHost = (scope: E2eeSignOutScope, signOut: SignOut) => Promise<void>;

let host: SignOutHost | null = null;

/** Called by the mounted prompt; returns its unregister function. */
export function registerE2eeSignOutHost(next: SignOutHost): () => void {
  host = next;
  return () => {
    if (host === next) {
      host = null;
    }
  };
}

/**
 * Runs `signOut`, after the encrypted-messages choice when one applies.
 * Resolves without signing out when the user cancels; rejects when the
 * sign-out itself fails, like the action alone would.
 */
export async function signOutWithE2eeChoice(
  scope: E2eeSignOutScope,
  signOut: SignOut
): Promise<void> {
  if (host) {
    await host(scope, signOut);
    return;
  }
  await signOut();
}
