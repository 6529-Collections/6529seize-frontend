import { z } from "zod";
import {
  base64ToBytes,
  bytesToBase64,
  randomBytes,
  toArrayBuffer,
  utf8Decode,
  utf8Encode,
} from "@/lib/e2ee/bytes";

export type ConnectionSetupTarget = "native" | "desktop";
const hexKey = z.string().regex(/^0x[0-9a-f]{64}$/);
export const connectionSetupSchema = z
  .object({
    version: z.literal(1),
    profileId: z.string().uuid(),
    privateKey: z.string().max(256),
    mlsState: z.string().max(24000),
    request: z
      .object({
        grant: z
          .object({
            wallet: z.string().regex(/^0x[0-9a-f]{40}$/),
            device_key: hexKey,
            scopes: z.array(z.string()).max(4),
            mls_device_key: hexKey,
            ciphersuite: z.number().int().positive(),
            // Grant v2 (D172): the signed suite set.
            version: z.literal(2).optional(),
            ciphersuites: z
              .array(z.number().int().positive())
              .min(1)
              .max(4)
              .optional(),
            issued_at: z.number().int().positive(),
            expires_at: z.number().int().positive(),
            origin: z.string().max(64),
          })
          .strict(),
        wallet_signature: z
          .string()
          .regex(/^0x[0-9a-f]+$/i)
          .max(8192),
        device_label: z.string().max(48),
      })
      .strict(),
  })
  .strict();
export type ConnectionSetupBundle = z.infer<typeof connectionSetupSchema>;

const urlEncode = (bytes: Uint8Array): string =>
  bytesToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const urlDecode = (text: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/u.test(text)) throw new Error("Invalid device setup");
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  return base64ToBytes(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
};
const context = (wallet: string, target: ConnectionSetupTarget): ArrayBuffer =>
  toArrayBuffer(
    utf8Encode(
      `6529-connection-device-setup:v1:${wallet.toLowerCase()}:${target}`
    )
  );

/** The server gets ciphertext; the 256-bit unlock secret stays in the QR/link fragment. */
export async function sealConnectionSetup(
  bundle: ConnectionSetupBundle,
  target: ConnectionSetupTarget
) {
  const secret = randomBytes(32);
  const iv = randomBytes(12);
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(secret),
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const plaintext = utf8Encode(
    JSON.stringify(connectionSetupSchema.parse(bundle))
  );
  try {
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: context(bundle.request.grant.wallet, target),
      },
      key,
      toArrayBuffer(plaintext)
    );
    const envelope = `v1.${urlEncode(iv)}.${urlEncode(new Uint8Array(ciphertext))}`;
    if (envelope.length > 32768) throw new Error("Device setup is too large");
    return { envelope, secret: urlEncode(secret) };
  } finally {
    secret.fill(0);
    plaintext.fill(0);
  }
}

export async function openConnectionSetup(
  envelope: string,
  secret: string,
  wallet: string,
  target: ConnectionSetupTarget
): Promise<ConnectionSetupBundle> {
  if (
    envelope.length > 32768 ||
    !/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/u.test(envelope) ||
    secret.length !== 43
  )
    throw new Error("Invalid device setup");
  const [, encodedIv, ciphertext] = envelope.split(".");
  const rawKey = urlDecode(secret);
  if (rawKey.length !== 32 || !encodedIv || !ciphertext)
    throw new Error("Invalid device setup");
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(rawKey),
      "AES-GCM",
      false,
      ["decrypt"]
    );
    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: toArrayBuffer(urlDecode(encodedIv)),
          additionalData: context(wallet, target),
        },
        key,
        toArrayBuffer(urlDecode(ciphertext))
      )
    );
    try {
      const bundle = connectionSetupSchema.parse(
        JSON.parse(utf8Decode(plaintext))
      );
      if (bundle.request.grant.wallet !== wallet.toLowerCase())
        throw new Error("Device setup wallet mismatch");
      return bundle;
    } finally {
      plaintext.fill(0);
    }
  } finally {
    rawKey.fill(0);
  }
}
