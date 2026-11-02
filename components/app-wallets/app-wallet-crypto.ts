// App-wallet encryption. Loaded on demand through `app-wallet-helpers` so the
// Node `crypto` polyfill only ships when an app wallet is created, imported,
// unlocked or migrated. The algorithm, key derivation and encodings must stay
// byte-compatible with payloads already stored on users' devices.
import crypto from "crypto";
import {
  APP_WALLET_CURRENT_ENCRYPTION_VERSION,
  APP_WALLET_CURRENT_IV_BYTES,
  APP_WALLET_CURRENT_KDF_ITERATIONS,
  APP_WALLET_CURRENT_KDF_SALT_BYTES,
  APP_WALLET_ENCRYPTION_ALGORITHM,
  APP_WALLET_ENCRYPTION_KEY_BYTES,
  APP_WALLET_LEGACY_KDF_ITERATIONS,
  parseAppWalletEnvelope,
  type AppWalletEncryptedEnvelopeV2,
} from "./app-wallet-envelope";

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
      APP_WALLET_ENCRYPTION_KEY_BYTES,
      "sha256",
      // pbkdf2 is callback-based; pbkdf2Sync would block the UI thread.
      // eslint-disable-next-line promise/prefer-await-to-callbacks -- see above
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
  return crypto.randomBytes(APP_WALLET_CURRENT_IV_BYTES);
}

export async function encryptAppWalletData(
  data: string,
  password: string
): Promise<string> {
  const salt = crypto
    .randomBytes(APP_WALLET_CURRENT_KDF_SALT_BYTES)
    .toString("hex");
  const key = await deriveKey(
    password,
    salt,
    APP_WALLET_CURRENT_KDF_ITERATIONS
  );
  const iv = generateIv();

  const cipher = crypto.createCipheriv(
    APP_WALLET_ENCRYPTION_ALGORITHM,
    key,
    iv
  );
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  const envelope: AppWalletEncryptedEnvelopeV2 = {
    version: APP_WALLET_CURRENT_ENCRYPTION_VERSION,
    algorithm: APP_WALLET_ENCRYPTION_ALGORITHM,
    kdf: {
      name: "pbkdf2",
      hash: "sha256",
      iterations: APP_WALLET_CURRENT_KDF_ITERATIONS,
      salt,
      key_length: APP_WALLET_ENCRYPTION_KEY_BYTES,
    },
    iv: iv.toString("hex"),
    auth_tag: authTag,
    ciphertext: encrypted,
  };

  return JSON.stringify(envelope);
}

export async function decryptAppWalletData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  const envelope = parseAppWalletEnvelope(encryptedData);
  if (envelope) {
    const key = await deriveKey(
      password,
      envelope.kdf.salt,
      envelope.kdf.iterations
    );
    const decipher = crypto.createDecipheriv(
      APP_WALLET_ENCRYPTION_ALGORITHM,
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

  const key = await deriveKey(password, salt, APP_WALLET_LEGACY_KDF_ITERATIONS);

  const decipher = crypto.createDecipheriv(
    APP_WALLET_ENCRYPTION_ALGORITHM,
    key,
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex!, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
