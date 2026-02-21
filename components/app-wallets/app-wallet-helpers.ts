import crypto from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

const LEGACY_PBKDF2_ITERATIONS = 100000;
const PBKDF2_ITERATIONS_V2 = 310000;
const SALT_BYTES_V2 = 16; // 128-bit salt

function deriveKeyLegacy(password: string, salt: string): Promise<Buffer> {
  // Legacy behavior intentionally preserves Buffer.from(salt, "hex") semantics.
  // Notably, values like "0x..." produce an empty buffer, which is how existing
  // wallets were encrypted historically and must remain decryptable.
  const saltBuffer = Buffer.from(salt, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      saltBuffer,
      LEGACY_PBKDF2_ITERATIONS,
      32,
      "sha256",
      (err, derivedKey) => {
        if (err) {
          reject(new Error(err.message || "Error deriving key"));
          return;
        }
        resolve(derivedKey);
      }
    );
  });
}

function deriveKeyV2(
  password: string,
  saltHex: string,
  iterations: number
): Promise<Buffer> {
  if (!/^[0-9a-fA-F]+$/.test(saltHex) || saltHex.length % 2 !== 0) {
    return Promise.reject(new Error("Invalid salt"));
  }
  const saltBuffer = Buffer.from(saltHex, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, saltBuffer, iterations, 32, "sha256", (err, key) => {
      if (err) {
        reject(new Error(err.message || "Error deriving key"));
        return;
      }
      resolve(key);
    });
  });
}

function generateIv() {
  return crypto.randomBytes(12); // Use 12 bytes for GCM IV
}

export async function encryptData(
  salt: string,
  data: string,
  password: string
): Promise<string> {
  // v2 format: v2:<iterations>:<saltHex>:<ivHex>:<authTagHex>:<ciphertextHex>
  // Note: "salt" param is retained for API compatibility but is no longer used.
  void salt;
  const iterations = PBKDF2_ITERATIONS_V2;
  const saltHex = crypto.randomBytes(SALT_BYTES_V2).toString("hex");
  const key = await deriveKeyV2(password, saltHex, iterations);
  const iv = generateIv();

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex"); // Retrieve the authentication tag

  return `v2:${iterations}:${saltHex}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export async function decryptData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  if (encryptedData.startsWith("v2:")) {
    const parts = encryptedData.split(":");
    if (parts.length !== 6) {
      throw new Error("Invalid encrypted payload");
    }
    const [, iterationsRaw, saltHex, ivHex, authTagHex, encryptedHex] = parts;
    const iterations = Number(iterationsRaw);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      throw new Error("Invalid encrypted payload");
    }

    const iv = Buffer.from(ivHex ?? "", "hex");
    const authTag = Buffer.from(authTagHex ?? "", "hex");

    const key = await deriveKeyV2(password, saltHex ?? "", iterations);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex ?? "", "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Legacy format: <ivHex>:<authTagHex>:<ciphertextHex>
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const key = await deriveKeyLegacy(password, salt);
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
