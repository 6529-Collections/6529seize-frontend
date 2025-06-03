import { commonApiPostWithoutBodyAndResponse } from '../../services/api/common-api';
import { getAuthJwt, getStagingAuth } from '../../services/auth/auth.utils';

jest.mock('../../services/auth/auth.utils', () => ({
  getAuthJwt: jest.fn(),
  getStagingAuth: jest.fn(),
}));

describe('commonApiPostWithoutBodyAndResponse', () => {
  const original = process.env.API_ENDPOINT;
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    (getStagingAuth as jest.Mock).mockReturnValue('s');
    process.env.API_ENDPOINT = 'http://api';
  });
  afterAll(() => { process.env.API_ENDPOINT = original; });

  it('posts and resolves when ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    await commonApiPostWithoutBodyAndResponse({ endpoint: 'e' });
    expect(global.fetch).toHaveBeenCalledWith('http://api/api/e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-6529-auth': 's' }, body: '' });
  });

  it('rejects with error body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'x', json: async () => ({ error: 'err' }) });
    await expect(commonApiPostWithoutBodyAndResponse({ endpoint: 'e' })).rejects.toBe('err');
  });
});
