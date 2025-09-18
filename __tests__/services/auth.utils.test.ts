import {
  setAuthJwt,
  getAuthJwt,
  getStagingAuth,
  removeAuthJwt,
  migrateCookiesToLocalStorage,
  getWalletAddress,
  getWalletRole,
  syncWalletRoleWithServer,
} from '../../services/auth/auth.utils';
import Cookies from 'js-cookie';
import { safeLocalStorage } from '../../helpers/safeLocalStorage';
import { jwtDecode } from 'jwt-decode';

jest.mock('js-cookie', () => ({ get: jest.fn(), set: jest.fn(), remove: jest.fn() }));
jest.mock('jwt-decode', () => ({ jwtDecode: jest.fn() }));
jest.mock('../../helpers/safeLocalStorage', () => ({
  safeLocalStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockStorage: Record<string, string | undefined> = {};

describe('auth.utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    (safeLocalStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      }
    );
    (safeLocalStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return mockStorage[key] ?? null;
    });
    (safeLocalStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete mockStorage[key];
    });
  });

  it('setAuthJwt stores tokens and cookie', () => {
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    setAuthJwt('addr', 'jwt', 'refresh', 'role');
    expect(Cookies.set).toHaveBeenCalledWith('wallet-auth', 'jwt', { secure: true, sameSite: 'strict', expires: 2 });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-address', 'addr');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-refresh-token', 'refresh');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-role', 'role');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('auth-role-addr', 'role');
    expect(mockStorage['6529-wallet-role']).toBe('role');
    expect(mockStorage['auth-role-addr']).toBe('role');
    dateSpy.mockRestore();
  });

  it('setAuthJwt clears stored role when none provided', () => {
    (jwtDecode as jest.Mock).mockReturnValue({ exp: 86400 * 2 });
    mockStorage['6529-wallet-role'] = 'old-role';
    mockStorage['auth-role-addr'] = 'old-role';

    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    setAuthJwt('ADDR', 'jwt', 'refresh');

    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('6529-wallet-role');
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('auth-role-addr');
    expect(mockStorage['6529-wallet-role']).toBeUndefined();
    expect(mockStorage['auth-role-addr']).toBeUndefined();
    dateSpy.mockRestore();
  });

  it('getAuthJwt prefers dev mode', () => {
    process.env.USE_DEV_AUTH = 'true';
    process.env.DEV_MODE_AUTH_JWT = 'dev';
    expect(getAuthJwt()).toBe('dev');
    process.env.USE_DEV_AUTH = 'false';
    (Cookies.get as jest.Mock).mockReturnValue('cookie');
    expect(getAuthJwt()).toBe('cookie');
  });

  it('getStagingAuth returns cookie or env', () => {
    (Cookies.get as jest.Mock).mockReturnValueOnce('c');
    expect(getStagingAuth()).toBe('c');
    (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
    process.env.STAGING_API_KEY = 'e';
    expect(getStagingAuth()).toBe('e');
  });

  it('migrateCookiesToLocalStorage moves and removes cookies', () => {
    (Cookies.get as jest.Mock)
      .mockReturnValueOnce('addr')
      .mockReturnValueOnce('refresh')
      .mockReturnValueOnce('role');
    migrateCookiesToLocalStorage();
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-address', 'addr');
    expect(Cookies.remove).toHaveBeenCalledWith('wallet-address');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-refresh-token', 'refresh');
    expect(Cookies.remove).toHaveBeenCalledWith('wallet-refresh-token');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-role', 'role');
    expect(Cookies.remove).toHaveBeenCalledWith('wallet-role');
  });

  it('getWalletAddress respects dev mode and storage', () => {
    process.env.USE_DEV_AUTH = 'true';
    process.env.DEV_MODE_WALLET_ADDRESS = 'devaddr';
    expect(getWalletAddress()).toBe('devaddr');
    process.env.USE_DEV_AUTH = 'false';
    safeLocalStorage.setItem('6529-wallet-address', 'stored');
    expect(getWalletAddress()).toBe('stored');
  });

  it('removeAuthJwt clears storage and cookie', () => {
    removeAuthJwt();
    expect(Cookies.remove).toHaveBeenCalledWith('wallet-auth', { secure: true, sameSite: 'strict' });
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('6529-wallet-address');
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('6529-wallet-refresh-token');
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('6529-wallet-role');
  });

  it('syncWalletRoleWithServer updates stored role from server', () => {
    syncWalletRoleWithServer('server-role', '0xAbC');

    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('6529-wallet-role', 'server-role');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('auth-role-0xabc', 'server-role');
    expect(mockStorage['6529-wallet-role']).toBe('server-role');
    expect(mockStorage['auth-role-0xabc']).toBe('server-role');
    expect(getWalletRole()).toBe('server-role');
  });

  it('syncWalletRoleWithServer clears stored role when server provides none', () => {
    mockStorage['6529-wallet-role'] = 'existing';
    mockStorage['auth-role-0xabc'] = 'existing';

    syncWalletRoleWithServer(null, '0xAbC');

    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('6529-wallet-role');
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('auth-role-0xabc');
    expect(getWalletRole()).toBeNull();
    expect(mockStorage['6529-wallet-role']).toBeUndefined();
    expect(mockStorage['auth-role-0xabc']).toBeUndefined();
  });
});
