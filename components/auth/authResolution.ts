import type { SeizeConnectContextType } from "./seizeConnectTypes";

/** Missing identity is inconclusive until the wallet and profile have settled. */
export function isAuthResolving(
  connectionState: SeizeConnectContextType["connectionState"],
  fetchingProfile = false
): boolean {
  return (
    connectionState === "initializing" ||
    connectionState === "connecting" ||
    fetchingProfile
  );
}

/** Signing surfaces additionally wait for the live connector to restore. */
export function isWalletConnectionResolving(
  connection: Pick<
    SeizeConnectContextType,
    "connectionState" | "isWalletConnectionPending"
  >
): boolean {
  return (
    isAuthResolving(connection.connectionState) ||
    connection.isWalletConnectionPending === true
  );
}
