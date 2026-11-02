import crypto from "node:crypto";
import fixture from "@/__tests__/fixtures/app-wallet-encrypted-payloads.json";
import {
  decryptData,
  encryptData,
} from "@/components/app-wallets/app-wallet-helpers";

// The fixture was produced by the implementation that shipped before the
// app-wallet crypto was lazy-loaded (v2 envelopes) and by the historical v1
// implementation. Stored wallets in users' secure storage carry exactly these
// shapes, so every fixture must keep decrypting byte-for-byte.
jest.setTimeout(60000);

const { passphrase } = fixture;
const walletAddress = fixture.v1.address.salt;
const v2Cases = Object.entries(fixture.v2);
const v1Cases = Object.entries(fixture.v1);

interface ReferenceEnvelope {
  version: number;
  kdf: { salt: string; iterations: number };
  iv: string;
  auth_tag: string;
  ciphertext: string;
}

function parseReferenceEnvelope(payload: string): ReferenceEnvelope | null {
  try {
    const parsed = JSON.parse(payload) as ReferenceEnvelope;
    return parsed.version === 2 ? parsed : null;
  } catch {
    return null;
  }
}

function referenceAesGcmDecrypt(params: {
  key: Buffer;
  ivHex: string;
  authTagHex: string;
  ciphertextHex: string;
}): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    params.key,
    Buffer.from(params.ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(params.authTagHex, "hex"));
  return (
    decipher.update(params.ciphertextHex, "hex", "utf8") +
    decipher.final("utf8")
  );
}

/**
 * Independent reference of the original algorithm, written against
 * node:crypto directly: PBKDF2-SHA256 (32-byte key) + AES-256-GCM, hex
 * encoded. v2 uses the envelope's salt/iterations; v1 uses `iv:tag:ct` with
 * the caller-supplied salt decoded as hex and 100000 iterations.
 */
function referenceDecrypt(
  legacySalt: string,
  payload: string,
  pass: string
): string {
  const envelope = parseReferenceEnvelope(payload);
  if (envelope) {
    return referenceAesGcmDecrypt({
      key: crypto.pbkdf2Sync(
        pass,
        Buffer.from(envelope.kdf.salt, "hex"),
        envelope.kdf.iterations,
        32,
        "sha256"
      ),
      ivHex: envelope.iv,
      authTagHex: envelope.auth_tag,
      ciphertextHex: envelope.ciphertext,
    });
  }

  const [ivHex = "", authTagHex = "", ciphertextHex = ""] = payload.split(":");
  return referenceAesGcmDecrypt({
    key: crypto.pbkdf2Sync(
      pass,
      Buffer.from(legacySalt, "hex"),
      100000,
      32,
      "sha256"
    ),
    ivHex,
    authTagHex,
    ciphertextHex,
  });
}

describe("app-wallet encrypted payload compatibility", () => {
  it.each(v2Cases)(
    "decrypts a stored v2 envelope fixture (%s)",
    async (_name, { plaintext, envelope }) => {
      await expect(
        decryptData(walletAddress, envelope, passphrase)
      ).resolves.toBe(plaintext);
    }
  );

  it.each(v1Cases)(
    "decrypts a stored legacy v1 fixture (%s)",
    async (_name, { plaintext, salt, payload }) => {
      await expect(decryptData(salt, payload, passphrase)).resolves.toBe(
        plaintext
      );
    }
  );

  it("agrees with the reference algorithm on every fixture", () => {
    for (const { plaintext, envelope } of Object.values(fixture.v2)) {
      expect(referenceDecrypt(walletAddress, envelope, passphrase)).toBe(
        plaintext
      );
    }
    for (const { plaintext, salt, payload } of Object.values(fixture.v1)) {
      expect(referenceDecrypt(salt, payload, passphrase)).toBe(plaintext);
    }
  });

  it.each(v2Cases)(
    "writes envelopes the reference algorithm decrypts (%s)",
    async (_name, { plaintext }) => {
      const envelope = await encryptData(walletAddress, plaintext, passphrase);

      expect(referenceDecrypt(walletAddress, envelope, passphrase)).toBe(
        plaintext
      );
    }
  );

  it("rejects stored fixtures with the wrong passphrase", async () => {
    await expect(
      decryptData(walletAddress, fixture.v2.address.envelope, `${passphrase}x`)
    ).rejects.toThrow();
    await expect(
      decryptData(walletAddress, fixture.v1.address.payload, `${passphrase}x`)
    ).rejects.toThrow();
  });
});
