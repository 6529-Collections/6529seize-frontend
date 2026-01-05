import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminProposeAddressesAndPercentages, { ProposalType } from '@/components/nextGen/admin/NextGenAdminProposeAddressesAndPercentages';

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({ data: 1 }),
  getCollectionIdsForAddress: () => ['1'],
  useMinterContractWrite: jest.fn(),
  useParsedCollectionIndex: () => 1,
}));

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => (
    <input data-testid={title} value={value} onChange={e=>setValue(e.target.value)} />
  ),
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);
jest.mock('@/components/nextGen/admin/NextGenAdmin', () => ({ printAdminErrors: (errs: string[]) => <ul>{errs.map(e => <li key={e}>{e}</li>)}</ul> }));

const helpers = require('@/components/nextGen/nextgen_helpers');

beforeEach(() => {
  (helpers.useMinterContractWrite as jest.Mock).mockReturnValue({
    writeContract: jest.fn(),
    reset: jest.fn(),
    params: {},
    isLoading: false,
    isSuccess: false,
    isError: false,
  });
});

describe('NextGenAdminProposeAddressesAndPercentages', () => {
  it('shows validation errors when submitting empty form', () => {
    render(<NextGenAdminProposeAddressesAndPercentages type={ProposalType.PRIMARY} close={()=>{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Collection id is required')).toBeInTheDocument();
    expect(screen.getByText('Primary address 1 is required')).toBeInTheDocument();
  });

  it('calls writeContract with filled values', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminProposeAddressesAndPercentages type={ProposalType.PRIMARY} close={()=>{}} />);
    const contract = (helpers.useMinterContractWrite as jest.Mock).mock.results[0]?.value;

    await user.type(screen.getByTestId('collection'), '1');
    await user.type(screen.getByTestId('Primary Address 1'), 'a1');
    await user.type(screen.getByTestId('Primary Address 2'), 'a2');
    await user.type(screen.getByTestId('Primary Address 3'), 'a3');
    await user.type(screen.getByTestId('Primary Percentage 1'), '10');
    await user.type(screen.getByTestId('Primary Percentage 2'), '20');
    await user.type(screen.getByTestId('Primary Percentage 3'), '70');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(contract.reset).toHaveBeenCalled());
  });
});
