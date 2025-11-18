import { createHmac } from "node:crypto";

/**
 * Generates a client signature for server-side authentication.
 *
 * The signature scheme uses HMAC-SHA256 to create a cryptographic signature
 * from a payload containing the client ID, timestamp, HTTP method, and path.
 * The timestamp is used to prevent replay attacks within a configurable time window
 * (typically 300 seconds / 5 minutes). The signature must match exactly on both
 * client and server for authentication to succeed.
 *
 * @param clientId - The client identifier (must be a non-empty string)
 * @param secret - The shared secret key for HMAC signing (must be a non-empty string)
 * @param method - The HTTP method (will be normalized to uppercase, must be non-empty)
 * @param path - The request path including query string if present (pathname + search, e.g., '/api/users?page=1'; must be non-empty)
 * @param timestamp - Optional Unix timestamp in seconds. If not provided, uses current time.
 * @returns An object containing the clientId, timestamp, and generated signature
 * @throws {TypeError} If called in a browser environment or if any required parameter is invalid
 *
 * @example
 * ```ts
 * const { signature } = generateClientSignature(
 *   'my-client-id',
 *   'my-secret',
 *   'POST',
 *   '/api/users?page=1'
 * );
 * ```
 */
export function generateClientSignature(
  clientId: string,
  secret: string,
  method: string,
  path: string,
  timestamp?: number
): { clientId: string; timestamp: number; signature: string } {
  if (globalThis.window !== undefined) {
    throw new TypeError(
      "generateClientSignature can only be used on the server side"
    );
  }

  if (typeof clientId !== "string" || clientId.trim().length === 0) {
    throw new TypeError(
      "generateClientSignature: clientId must be a non-empty string"
    );
  }

  if (typeof secret !== "string" || secret.trim().length === 0) {
    throw new TypeError(
      "generateClientSignature: secret must be a non-empty string"
    );
  }

  if (typeof method !== "string" || method.trim().length === 0) {
    throw new TypeError(
      "generateClientSignature: method must be a non-empty string"
    );
  }

  if (typeof path !== "string" || path.trim().length === 0) {
    throw new TypeError(
      "generateClientSignature: path must be a non-empty string"
    );
  }

  const normalizedMethod = method.toUpperCase();
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = `${clientId}\n${ts}\n${normalizedMethod}\n${path}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  return {
    clientId,
    timestamp: ts,
    signature,
  };
}

export function generateWafSignature(clientId: string, secret: string): string {
  if (globalThis.window !== undefined) {
    throw new TypeError(
      "generateWafSignature can only be used on the server side"
    );
  }

  if (typeof clientId !== "string" || clientId.trim().length === 0) {
    throw new TypeError(
      "generateWafSignature: clientId must be a non-empty string"
    );
  }

  if (typeof secret !== "string" || secret.trim().length === 0) {
    throw new TypeError(
      "generateWafSignature: secret must be a non-empty string"
    );
  }

  const signature = createHmac("sha256", secret).update(clientId).digest("hex");

  return signature;
}
