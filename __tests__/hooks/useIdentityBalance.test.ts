import { renderHook } from '@testing-library/react';

const useQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any) => useQueryMock(...args),
}));

const commonApiFetch = jest.fn();
jest.mock('../../services/api/common-api', () => ({
  commonApiFetch: (...args: any) => commonApiFetch(...args),
}));

import { useIdentityBalance } from '../../hooks/useIdentityBalance';

describe('useIdentityBalance', () => {
  it('calls useQuery with proper params', async () => {
    useQueryMock.mockReturnValue({});
    renderHook(() => useIdentityBalance({ consolidationKey: 'key1' }));
    const opts = useQueryMock.mock.calls[0][0];
    expect(opts.queryKey).toEqual(['identity-balance', 'key1']);
    await opts.queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: 'owners-balances/consolidation/key1',
    });
    expect(opts.enabled).toBe(true);
  });
});
