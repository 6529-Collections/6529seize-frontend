import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenAdminAddRandomizer from '@/components/nextGen/admin/NextGenAdminAddRandomizer';

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => ({ __esModule: true, default: () => <div /> }));

const writeContract = jest.fn();

beforeEach(() => {
  (global as any).ResizeObserver = class { observe(){} disconnect(){} };
});

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({ data: 2 }),
  useParsedCollectionIndex: () => 2,
  useCollectionAdmin: () => ({ data: [{ result: true }] }),
  getCollectionIdsForAddress: () => ['1','2'],
  useCollectionAdditionalData: (_id: string, cb: any) => { React.useEffect(() => cb({ randomizer: '0xabc' }), []); },
  useCoreContractWrite: () => ({
    params: { func: 'add' },
    writeContract,
    reset: jest.fn(),
    isLoading: false,
    isSuccess: false,
    isError: false,
  }),
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ address: '0x1' }),
}));

describe('NextGenAdminAddRandomizer', () => {
  it('submits values to contract write', async () => {
    render(<NextGenAdminAddRandomizer close={jest.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('...Randomizer Contract'), { target: { value: '0x123' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(writeContract).toHaveBeenCalled());
    expect(writeContract).toHaveBeenCalledWith({ func: 'add', args: ['1','0x123'] });
  });
});
