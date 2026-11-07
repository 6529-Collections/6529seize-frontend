import { jwtDecode } from "jwt-decode";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";

const ANONYMOUS_SOCKET_IDENTITY = "anonymous";

/**
 * Who a socket authenticates as. A rotated access token for the same wallet
 * and role keeps the key, so an open socket can re-authenticate in place.
 * A profile switch, a sign-out or a token that cannot be read changes it,
 * and those still replace the socket.
 */
export const getSocketIdentityKey = (
  token: string | null | undefined
): string => {
  if (!token) {
    return ANONYMOUS_SOCKET_IDENTITY;
  }
  try {
    const { sub, role } = jwtDecode<{
      readonly sub?: unknown;
      readonly role?: unknown;
    }>(token);
    if (typeof sub === "string" && sub.length > 0) {
      const roleKey = typeof role === "string" ? role.toLowerCase() : "";
      return `wallet:${sub.toLowerCase()}|role:${roleKey}`;
    }
  } catch {
    // An unreadable token never matches another one.
  }
  return `token:${getAuthTokenFingerprint(token)}`;
};
