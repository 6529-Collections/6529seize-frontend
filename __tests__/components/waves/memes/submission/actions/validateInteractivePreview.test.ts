import { validateInteractivePreview } from '@/components/waves/memes/submission/actions/validateInteractivePreview';

const originalFetch = global.fetch;

const setResponseUrl = (response: Response, url: string) => {
  Object.defineProperty(response, 'url', {
    value: url,
    configurable: true,
    writable: false,
  });
  return response;
};

const createResponse = (
  status: number,
  headers: Record<string, string>,
  url = 'https://ipfs.io/ipfs/example'
) => {
  const response = new Response(null, {
    status,
    headers,
  });
  return setResponseUrl(response, url);
};

describe('validateInteractivePreview', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('accepts HTML content served over an approved gateway', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, { 'content-type': 'text/html; charset=utf-8' })
    );

    const result = await validateInteractivePreview({
      provider: 'ipfs',
      path: 'bafyHash/index.html',
    });

    expect(result.ok).toBe(true);
    expect(result.contentType).toBe('text/html; charset=utf-8');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('https://ipfs.io/ipfs/bafyHash/index.html'),
      expect.objectContaining({ method: 'HEAD' })
    );
  });

  it('falls back to a ranged GET when HEAD is unsupported', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createResponse(405, { 'content-type': 'text/plain' }))
      .mockResolvedValueOnce(
        createResponse(206, { 'content-type': 'text/html' }, 'https://arweave.net/example')
      );

    const result = await validateInteractivePreview({
      provider: 'arweave',
      path: 'abc/index.html',
    });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://arweave.net/abc/index.html'),
      expect.objectContaining({ method: 'GET', headers: { Range: 'bytes=0-1024' } })
    );
  });

  it('accepts HTML content served from an arweave subdomain', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(
        200,
        { 'content-type': 'text/html' },
        'https://ifx4blsbsfs22lskmlsb6zsazvhxcoibl4nkk3checvtipo6hkhq.arweave.net/index.html'
      )
    );

    const result = await validateInteractivePreview({
      provider: 'arweave',
      path: 'QW_ArkGRZa0uSmLkH2ZAzU9xOQFfGqVsRyCrND3eOo8/index.html',
    });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects responses with disallowed content types', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, { 'content-type': 'application/octet-stream' })
    );

    const result = await validateInteractivePreview({
      provider: 'ipfs',
      path: 'bafyHash/index.html',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Media must respond with an HTML document.');
  });

  it('fails when the gateway redirects to an unapproved host', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, { 'content-type': 'text/html' }, 'https://example.com/bad')
    );

    const result = await validateInteractivePreview({
      provider: 'ipfs',
      path: 'bafyHash/index.html',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Gateway redirected to an unapproved host.');
  });

  it('propagates network failures as validation errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));

    const result = await validateInteractivePreview({
      provider: 'ipfs',
      path: 'bafyHash/index.html',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Unable to reach the content gateway.');
  });
});
