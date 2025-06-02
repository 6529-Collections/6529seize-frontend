import { renderHook } from '@testing-library/react';
import { useOrignalDelegatorEnsResolution, getGasError } from '../../../components/delegation/delegation_shared';
import { useEnsName } from 'wagmi';

jest.mock('wagmi', () => ({ useEnsName: jest.fn() }));

describe('useOrignalDelegatorEnsResolution', () => {
  it('passes original delegator to useEnsName', () => {
    const mock = useEnsName as jest.Mock;
    mock.mockReturnValue({ data: 'ens' });
    renderHook(() => useOrignalDelegatorEnsResolution({ subdelegation: { originalDelegator: '0x1' } }));
    expect(mock).toHaveBeenCalledWith({ address: '0x1', chainId: 1 });
  });

  it('returns undefined when no subdelegation', () => {
    const mock = useEnsName as jest.Mock;
    renderHook(() => useOrignalDelegatorEnsResolution({}));
    expect(mock).toHaveBeenCalledWith({ address: undefined, chainId: 1 });
  });
});

describe('getGasError', () => {
  it('handles chain mismatch', () => {
    expect(getGasError({ message: 'Chain mismatch' })).toContain('Switch');
  });

  it('handles locked error', () => {
    expect(getGasError({ message: 'Other' })).toContain('CANNOT ESTIMATE');
  });
});
