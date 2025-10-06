import { renderHook, waitFor } from '@testing-library/react';
import { useHashtagLookupService } from '@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin';
jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  isEthereumAddress: () => true,
  __esModule: true,
}));

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('fetches nft info when query valid', async () => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ tokens: [{ token: { contract: 'c', tokenId: '1', name: 'n', imageSmall: 'p' } }] }),
  });

  const { result } = renderHook(() => useHashtagLookupService('c:1'));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await waitFor(() => expect(result.current.length).toBe(1));
});

test('returns empty when query invalid', async () => {
  const { result } = renderHook(() => useHashtagLookupService('bad'));
  await waitFor(() => expect(result.current.length).toBe(0));
});
