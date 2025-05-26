import crypto from 'crypto';
import { encryptData, decryptData } from '../../../components/app-wallets/app-wallet-helpers';

describe('app-wallet-helpers', () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const password = 'test-pass';
  const data = 'secret data';

  it('encrypts and decrypts data symmetrically', async () => {
    const encrypted = await encryptData(salt, data, password);
    const decrypted = await decryptData(salt, encrypted, password);
    expect(decrypted).toBe(data);
  });

  it('throws when decryption password is wrong', async () => {
    const encrypted = await encryptData(salt, data, password);
    await expect(decryptData(salt, encrypted, 'wrong')).rejects.toThrow();
  });

  it('propagates errors from deriveKey', async () => {
    const error = new Error('pbkdf2 failed');
    jest.spyOn(crypto, 'pbkdf2').mockImplementation((_p,_s,_i,_l,_d,cb) => {
      cb(error as any, null as any);
    });
    await expect(encryptData(salt, data, password)).rejects.toThrow('pbkdf2 failed');
    (crypto.pbkdf2 as jest.Mock).mockRestore();
  });
});
