import crypto from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-cbc";

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
        if (err) reject(err);
        resolve(derivedKey);
      }
    );
  });
}

// Function to generate a random IV
function generateIv() {
  return crypto.randomBytes(16); // AES uses a 16-byte IV
}

function computeHmac(key: Buffer, data: string): string {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
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

  const hmacKey = key.subarray(16);
  const hmac = computeHmac(
    hmacKey,
    `${salt}:${iv.toString("hex")}:${encrypted}`
  );

  // Return salt, IV, encrypted data, and HMAC
  return `${salt}:${iv.toString("hex")}:${encrypted}:${hmac}`;
}

export async function decryptData(
  encryptedData: string,
  password: string
): Promise<string> {
  const [salt, ivHex, encryptedHex, hmac] = encryptedData.split(":");
  if (!salt || !ivHex || !encryptedHex || !hmac) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const key = await deriveKey(password, salt);

  const hmacKey = key.subarray(16);
  const computedHmac = computeHmac(hmacKey, `${salt}:${ivHex}:${encryptedHex}`);
  if (computedHmac !== hmac) {
    throw new Error("HMAC verification failed");
  }

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
