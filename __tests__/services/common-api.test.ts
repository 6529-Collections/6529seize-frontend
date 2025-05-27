import { commonApiFetch } from '../../services/api/common-api';
import { getStagingAuth, getAuthJwt } from '../../services/auth/auth.utils';

jest.mock('../../services/auth/auth.utils', () => ({
  getStagingAuth: jest.fn(),
  getAuthJwt: jest.fn(),
}));

describe('commonApiFetch', () => {
  const originalEndpoint = process.env.API_ENDPOINT;
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    jest.resetAllMocks();
    process.env.API_ENDPOINT = 'http://example.com';
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEndpoint;
  });

  it('builds url with params and headers', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue('s');
    (getAuthJwt as jest.Mock).mockReturnValue('jwt');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ result: 1 }) });

    const result = await commonApiFetch<{ result: number }>({
      endpoint: 'test',
      params: { foo: 'bar', typ: 'nic' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://example.com/api/test?foo=bar&typ=cic',
      { headers: { 'Content-Type': 'application/json', 'x-6529-auth': 's', Authorization: 'Bearer jwt' }, signal: undefined }
    );
    expect(result).toEqual({ result: 1 });
  });

  it('rejects with error body when not ok', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Bad', json: async () => ({ error: 'err' }) });

    await expect(
      commonApiFetch({ endpoint: 'bad' })
    ).rejects.toBe('err');
  });
});

describe('commonApiPost', () => {
  const originalEndpoint = process.env.API_ENDPOINT;
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    process.env.API_ENDPOINT = 'http://example.com';
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEndpoint;
  });

  it('posts data and returns json', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue('a');
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ res: 1 }) });
    const { commonApiPost } = await import('../../services/api/common-api');
    const result = await commonApiPost<{v:number},{res:number}>({ endpoint:'e', body:{v:1} });
    expect(global.fetch).toHaveBeenCalledWith('http://example.com/api/e', { method:'POST', headers:{ 'Content-Type':'application/json','x-6529-auth':'a'}, body: JSON.stringify({v:1}) });
    expect(result).toEqual({ res:1 });
  });

  it('rejects on error', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText:'B', json: async () => ({ error:'err' }) });
    const { commonApiPost } = await import('../../services/api/common-api');
    await expect(commonApiPost({ endpoint:'e', body:{} })).rejects.toBe('err');
  });
});
