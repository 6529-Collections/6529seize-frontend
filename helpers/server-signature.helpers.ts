import { createHmac } from "crypto";

export function generateClientSignature(
  clientId: string,
  secret: string,
  method: string,
  path: string,
  timestamp?: number
): { clientId: string; timestamp: number; signature: string } {
  if (typeof window !== "undefined") {
    throw new Error(
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

