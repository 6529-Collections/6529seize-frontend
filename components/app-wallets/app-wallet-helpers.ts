import crypto from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const LEGACY_KDF_ITERATIONS = 100000;
const CURRENT_ENCRYPTION_VERSION = 2;
const CURRENT_KDF_ITERATIONS = 600000;
const MIN_V2_DECRYPT_KDF_ITERATIONS = LEGACY_KDF_ITERATIONS + 1;
const CURRENT_KDF_SALT_BYTES = 16;
const CURRENT_IV_BYTES = 12;
const ENCRYPTION_KEY_BYTES = 32;
const APP_WALLET_MIN_PASSPHRASE_LENGTH = 12;

interface AppWalletEncryptedEnvelopeV2 {
  version: 2;
  algorithm: typeof ENCRYPTION_ALGORITHM;
  kdf: {
    name: "pbkdf2";
    hash: "sha256";
    iterations: number;
    salt: string;
    key_length: number;
  };
  iv: string;
  auth_tag: string;
  ciphertext: string;
}

const HEX_PATTERN = /^[0-9a-f]+$/i;

export function getAppWalletPassphraseError(password: string): string | null {
  if (password.length < APP_WALLET_MIN_PASSPHRASE_LENGTH) {
    return `Password must be at least ${APP_WALLET_MIN_PASSPHRASE_LENGTH} characters long`;
  }

  if (/\s/.test(password)) {
    return "Password must not contain any whitespace characters";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter";
  }

  if (!/\d/.test(password)) {
    return "Password must include a number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a symbol";
  }

  return null;
}

function deriveKey(
  password: string,
  salt: string,
  iterations: number
): Promise<Buffer> {
  const saltBuffer = Buffer.from(salt, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      saltBuffer,
      iterations,
      ENCRYPTION_KEY_BYTES,
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

function generateIv() {
  return crypto.randomBytes(CURRENT_IV_BYTES);
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_PATTERN.test(value);
}

function parseEnvelope(
  encryptedData: string
): AppWalletEncryptedEnvelopeV2 | null {
  try {
    const parsed = JSON.parse(
      encryptedData
    ) as Partial<AppWalletEncryptedEnvelopeV2>;

    if (
      parsed.version !== CURRENT_ENCRYPTION_VERSION ||
      parsed.algorithm !== ENCRYPTION_ALGORITHM ||
      parsed.kdf?.name !== "pbkdf2" ||
      parsed.kdf.hash !== "sha256" ||
      parsed.kdf.iterations < MIN_V2_DECRYPT_KDF_ITERATIONS ||
      parsed.kdf.key_length !== ENCRYPTION_KEY_BYTES ||
      !isHex(parsed.kdf.salt) ||
      Buffer.from(parsed.kdf.salt, "hex").length < CURRENT_KDF_SALT_BYTES ||
      !isHex(parsed.iv) ||
      Buffer.from(parsed.iv, "hex").length !== CURRENT_IV_BYTES ||
      !isHex(parsed.auth_tag) ||
      Buffer.from(parsed.auth_tag, "hex").length !== 16 ||
      !isHex(parsed.ciphertext)
    ) {
      return null;
    }

    return parsed as AppWalletEncryptedEnvelopeV2;
  } catch {
    return null;
  }
}

export function isAppWalletEncryptedEnvelope(value: unknown): boolean {
  return typeof value === "string" && parseEnvelope(value) !== null;
}

export function getAppWalletEncryptionVersion(value: unknown): 1 | 2 | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  return parseEnvelope(value) ? 2 : 1;
}

export async function encryptData(
  _legacySalt: string,
  data: string,
  password: string
): Promise<string> {
  const salt = crypto.randomBytes(CURRENT_KDF_SALT_BYTES).toString("hex");
  const key = await deriveKey(password, salt, CURRENT_KDF_ITERATIONS);
  const iv = generateIv();

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  const envelope: AppWalletEncryptedEnvelopeV2 = {
    version: CURRENT_ENCRYPTION_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    kdf: {
      name: "pbkdf2",
      hash: "sha256",
      iterations: CURRENT_KDF_ITERATIONS,
      salt,
      key_length: ENCRYPTION_KEY_BYTES,
    },
    iv: iv.toString("hex"),
    auth_tag: authTag,
    ciphertext: encrypted,
  };

  return JSON.stringify(envelope);
}

export async function decryptData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  const envelope = parseEnvelope(encryptedData);
  if (envelope) {
    const key = await deriveKey(
      password,
      envelope.kdf.salt,
      envelope.kdf.iterations
    );
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(envelope.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(envelope.auth_tag, "hex"));

    let decrypted = decipher.update(envelope.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex!, "hex");
  const authTag = Buffer.from(authTagHex!, "hex");

  const key = await deriveKey(password, salt, LEGACY_KDF_ITERATIONS);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex!, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
