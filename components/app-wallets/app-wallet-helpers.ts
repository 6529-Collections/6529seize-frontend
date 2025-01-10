import crypto from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function deriveKey(password: string, salt: string): Promise<Buffer> {
  const saltBuffer = Buffer.from(salt, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      saltBuffer,
      100000,
      32,
      "sha256",
      (err, derivedKey) => {
        if (err) reject(new Error(err.message || "Error deriving key"));
        resolve(derivedKey);
      }
    );
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
  const key = await deriveKey(password, salt);
  const iv = generateIv();

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex"); // Retrieve the authentication tag

  // Return IV, AuthTag, and Encrypted Data as a concatenated string
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export async function decryptData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const key = await deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag); // Set the authentication tag

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
