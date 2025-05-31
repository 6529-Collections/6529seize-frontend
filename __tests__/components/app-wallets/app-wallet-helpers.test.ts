import { encryptData, decryptData } from '../../../components/app-wallets/app-wallet-helpers';

const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
const password = 'test-password';
const data = 'secret-data';

describe('app-wallet-helpers', () => {
  it('encrypts and decrypts data with same password', async () => {
    const encrypted = await encryptData(salt, data, password);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(data);
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
});
