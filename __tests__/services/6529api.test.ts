import * as api from '@/services/6529api';
import Cookies from 'js-cookie';
import { getStagingAuth } from '@/services/auth/auth.utils';
import { API_AUTH_COOKIE } from '@/constants';

jest.mock('js-cookie', () => ({ remove: jest.fn() }));
jest.mock('@/services/auth/auth.utils', () => ({ getStagingAuth: jest.fn() }));

const { fetchUrl, fetchAllPages, postData, postFormData } = api;

describe('6529api service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('fetchUrl removes cookie on 401 and returns json', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue('token');
    const json = jest.fn().mockResolvedValue({ ok: true });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 401, json });

    const result = await fetchUrl('/foo');

    expect(global.fetch).toHaveBeenCalledWith('/foo', { headers: { 'x-6529-auth': 'token' } });
    expect(Cookies.remove).toHaveBeenCalledWith(API_AUTH_COOKIE);
    expect(result).toEqual({ ok: true });
  });

  it('fetchAllPages concatenates pages', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 200, json: async () => ({ data: ['a'], next: 'http://localhost/next' }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ data: ['b'] }) });

    const result = await fetchAllPages('http://localhost/start');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'http://localhost/start', { headers: {} });
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://localhost/next', { headers: {} });
    expect(result).toEqual(['a', 'b']);
  });

  it('postData sends JSON body and returns status/response', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    const json = jest.fn().mockResolvedValue({ done: true });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 201, json });

    const result = await postData('/bar', { foo: 'bar' });

    expect(global.fetch).toHaveBeenCalledWith('/bar', {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ status: 201, response: { done: true } });
  });

  it('postFormData sends FormData body with auth header', async () => {
    (getStagingAuth as jest.Mock).mockReturnValue('tok');
    const formData = new FormData();
    const json = jest.fn().mockResolvedValue({ ok: true });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200, json });

    const result = await postFormData('/fd', formData);

    expect(global.fetch).toHaveBeenCalledWith('/fd', {
      method: 'POST',
      body: formData,
      headers: { 'x-6529-auth': 'tok' },
    });
    expect(result).toEqual({ status: 200, response: { ok: true } });
  });
});
