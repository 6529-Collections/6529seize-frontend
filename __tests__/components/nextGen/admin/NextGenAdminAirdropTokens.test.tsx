import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminAirdropTokens from '../../../../components/nextGen/admin/NextGenAdminAirdropTokens';

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({ data: 1 }),
  useParsedCollectionIndex: () => 1,
  useCollectionAdmin: () => ({ data: [] }),
  getCollectionIdsForAddress: () => ['1'],
  useMinterContractWrite: () => ({ writeContract: jest.fn(), reset: jest.fn(), params: {} , isLoading:false,isSuccess:false,isError:false,data:null,error:null }),
}));

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div />);
jest.mock('../../../../components/nextGen/admin/NextGenAdmin', () => ({ printAdminErrors: (errs: string[]) => <ul>{errs.map(e=> <li key={e}>{e}</li>)}</ul> }));

describe('NextGenAdminAirdropTokens', () => {
  it('shows validation errors when submitting empty form', async () => {
    render(<NextGenAdminAirdropTokens close={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('At least one recipient is required')).toBeInTheDocument();
    expect(screen.getByText('At least one token data is required')).toBeInTheDocument();
  });
});
