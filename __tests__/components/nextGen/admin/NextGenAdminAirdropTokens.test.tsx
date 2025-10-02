import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminAirdropTokens from '@/components/nextGen/admin/NextGenAdminAirdropTokens';

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

let writeMock: jest.Mock;
jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({ data: 1 }),
  useParsedCollectionIndex: () => 1,
  useCollectionAdmin: () => ({ data: [] }),
  getCollectionIdsForAddress: () => ['1'],
  useMinterContractWrite: () => {
    writeMock = jest.fn();
    return { writeContract: writeMock, reset: jest.fn(), params: {}, isLoading:false,isSuccess:false,isError:false,data:null,error:null };
  },
}));

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div />);
jest.mock('@/components/nextGen/admin/NextGenAdmin', () => ({ printAdminErrors: (errs: string[]) => <ul>{errs.map(e=> <li key={e}>{e}</li>)}</ul> }));

describe('NextGenAdminAirdropTokens', () => {
  it('shows validation errors when submitting empty form', async () => {
    render(<NextGenAdminAirdropTokens close={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('At least one recipient is required')).toBeInTheDocument();
    expect(screen.getByText('At least one token data is required')).toBeInTheDocument();
  });

  it('submits form with values', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminAirdropTokens close={() => {}} />);
    const areas = screen.getAllByPlaceholderText('One line per entry');
    await user.type(areas[0], '0x1\n0x2');
    await user.type(areas[1], 'a\nb');
    await user.type(areas[2], 's1\ns2');
    await user.type(screen.getByTestId('collection'), '1');
    await user.type(areas[3], '1\n2');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByTestId('heading');
    expect(writeMock).toHaveBeenCalled();
    const args = writeMock.mock.calls[0][0].args;
    expect(args[0]).toEqual(['0x1','0x2']);
    expect(args[1]).toEqual(['a','b']);
    expect(args[4]).toEqual([1,2]);
  });
});
