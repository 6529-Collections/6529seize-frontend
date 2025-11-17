import { createHmac } from "node:crypto";

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

  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = `${clientId}\n${ts}\n${method}\n${path}`;
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

  const signature = createHmac("sha256", secret).update(clientId).digest("hex");

  return signature;
}
