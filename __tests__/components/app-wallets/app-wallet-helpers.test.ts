import crypto from "node:crypto";
import {
  decryptData,
  encryptData,
  getAppWalletEncryptionVersion,
  getAppWalletPassphraseError,
  isAppWalletEncryptedEnvelope,
} from "@/components/app-wallets/app-wallet-helpers";

const salt = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
const password = "test-password";
const data = "secret-data";

describe("app-wallet-helpers", () => {
  it("encrypts and decrypts data with same password", async () => {
    const encrypted = await encryptData(salt, data, password);
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toBe(data);
    const decrypted = await decryptData(salt, encrypted, password);
    expect(decrypted).toBe(data);
  });

  it("produces different ciphertexts for same input", async () => {
    const encrypted1 = await encryptData(salt, data, password);
    const encrypted2 = await encryptData(salt, data, password);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("stores v2 envelope metadata with a random salt", async () => {
    const encrypted = await encryptData(salt, data, password);
    const envelope = JSON.parse(encrypted);

    expect(envelope.version).toBe(2);
    expect(envelope.algorithm).toBe("aes-256-gcm");
    expect(envelope.kdf).toMatchObject({
      name: "pbkdf2",
      hash: "sha256",
      iterations: 600000,
      key_length: 32,
    });
    expect(envelope.kdf.salt).not.toBe(salt);
    expect(isAppWalletEncryptedEnvelope(encrypted)).toBe(true);
    expect(getAppWalletEncryptionVersion(encrypted)).toBe(2);
  });

  it("decrypts v2 envelopes created with older supported KDF iterations", async () => {
    const legacyV2Iterations = 100001;
    const v2Salt = crypto.randomBytes(16).toString("hex");
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(
      password,
      Buffer.from(v2Salt, "hex"),
      legacyV2Iterations,
      32,
      "sha256"
    );
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const olderV2Envelope = JSON.stringify({
      version: 2,
      algorithm: "aes-256-gcm",
      kdf: {
        name: "pbkdf2",
        hash: "sha256",
        iterations: legacyV2Iterations,
        salt: v2Salt,
        key_length: 32,
      },
      iv: iv.toString("hex"),
      auth_tag: cipher.getAuthTag().toString("hex"),
      ciphertext: encrypted,
    });

    expect(isAppWalletEncryptedEnvelope(olderV2Envelope)).toBe(true);
    expect(getAppWalletEncryptionVersion(olderV2Envelope)).toBe(2);
    await expect(decryptData(salt, olderV2Envelope, password)).resolves.toBe(
      data
    );
  });

  it("throws when decrypting with wrong password", async () => {
    const encrypted = await encryptData(salt, data, password);
    await expect(
      decryptData(salt, encrypted, "wrong-password")
    ).rejects.toThrow();
  });

  it("can still decrypt legacy v1 payloads for migration", async () => {
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, "hex"),
      100000,
      32,
      "sha256"
    );
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const legacyPayload = `${iv.toString("hex")}:${cipher
      .getAuthTag()
      .toString("hex")}:${encrypted}`;

    await expect(decryptData(salt, legacyPayload, password)).resolves.toBe(
      data
    );
    expect(getAppWalletEncryptionVersion(legacyPayload)).toBe(1);
  });

  it("validates stronger app-wallet passphrases", () => {
    expect(getAppWalletPassphraseError("short")).toBe(
      "Password must be at least 12 characters long"
    );
    expect(getAppWalletPassphraseError("longbutlowercase1!")).toBe(
      "Password must include an uppercase letter"
    );
    expect(getAppWalletPassphraseError("StrongPass1!")).toBeNull();
  });
});
