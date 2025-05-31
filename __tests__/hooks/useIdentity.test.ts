import { renderHook } from '@testing-library/react';
import { useIdentity } from '../../hooks/useIdentity';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

const { useQuery } = require('@tanstack/react-query');

describe('useIdentity', () => {
  it('calls useQuery with lower case key', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: { handle: 'alice' }, isLoading: false });
    const { result } = renderHook(() => useIdentity({ handleOrWallet: 'Alice', initialProfile: null }));
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [QueryKey.PROFILE, 'alice'], enabled: true }));
    expect(result.current.profile).toEqual({ handle: 'alice' });
  });

  it('returns null profile when disabled', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    const { result } = renderHook(() => useIdentity({ handleOrWallet: null, initialProfile: null }));
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(result.current.profile).toBeNull();
  });
});
