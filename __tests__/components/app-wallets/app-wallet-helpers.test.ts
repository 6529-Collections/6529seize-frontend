import { encryptData, decryptData } from '@/components/app-wallets/app-wallet-helpers';
import crypto from 'crypto';

const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
const password = 'test-password';
const data = 'secret-data';

async function encryptLegacy(saltValue: string, plaintext: string, pass: string) {
  const saltBuffer = Buffer.from(saltValue, 'hex');
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(pass, saltBuffer, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

describe('app-wallet-helpers', () => {
  it('encrypts and decrypts data with same password', async () => {
    const encrypted = await encryptData(salt, data, password);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(data);
    expect(encrypted.startsWith('v2:')).toBe(true);
    const decrypted = await decryptData(salt, encrypted, password);
    expect(decrypted).toBe(data);
  });

  it('produces different ciphertexts for same input', async () => {
    const encrypted1 = await encryptData(salt, data, password);
    const encrypted2 = await encryptData(salt, data, password);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('throws when decrypting with wrong password', async () => {
    const encrypted = await encryptData(salt, data, password);
    await expect(decryptData(salt, encrypted, 'wrong-password')).rejects.toThrow();
  });

  it('decrypts legacy payloads for backwards compatibility', async () => {
    const legacyEncrypted = await encryptLegacy(salt, data, password);
    const decrypted = await decryptData(salt, legacyEncrypted, password);
    expect(decrypted).toBe(data);
  });

  it('decrypts legacy payloads created with 0x-prefixed salts', async () => {
    const addressLikeSalt = '0x1234abcd';
    const legacyEncrypted = await encryptLegacy(addressLikeSalt, data, password);
    const decrypted = await decryptData(addressLikeSalt, legacyEncrypted, password);
    expect(decrypted).toBe(data);
  });
});
