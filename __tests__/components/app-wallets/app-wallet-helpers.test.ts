import { encryptData, decryptData } from '../../../components/app-wallets/app-wallet-helpers';

const salt = 'deadbeefcafebabe0001020304050607';

describe('app-wallet-helpers', () => {
  it('encrypts and decrypts data with same password', async () => {
    const encrypted = await encryptData(salt, 'hello', 'pw');
    expect(encrypted).not.toEqual('hello');
    const decrypted = await decryptData(salt, encrypted, 'pw');
    expect(decrypted).toBe('hello');
  });

  it('throws when password is incorrect', async () => {
    const encrypted = await encryptData(salt, 'secret', 'pw');
    await expect(decryptData(salt, encrypted, 'wrong')).rejects.toThrow();
  });
});
