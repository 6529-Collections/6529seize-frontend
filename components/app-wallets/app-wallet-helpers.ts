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

// Encryption Function with the method signature you specified
export async function encryptData(
  salt: string,
  data: string,
  password: string
): Promise<string> {
  const key = await deriveKey(password, salt);
  const iv = generateIv(); // Generate a random IV for each encryption

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return the IV and encrypted data as a concatenated string (separate with ':')
  return `${iv.toString("hex")}:${encrypted}`;
}

// Decryption Function with the method signature you specified
export async function decryptData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  const [ivHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = await deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
