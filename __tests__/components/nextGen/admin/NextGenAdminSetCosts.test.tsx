import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminSetCosts from '../../../../components/nextGen/admin/NextGenAdminSetCosts';

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(() => ({ data: true })),
  useFunctionAdmin: jest.fn(() => ({ data: true })),
  useCollectionIndex: jest.fn(() => ({ data: 2 })),
  useCollectionAdmin: jest.fn(() => ({ data: [] })),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useCollectionCosts: jest.fn(),
  useMinterContractWrite: jest.fn(() => ({ writeContract: jest.fn(), reset: jest.fn(), params: {}, isSuccess:false, isError:false })),
  useParsedCollectionIndex: jest.fn(() => 2),
}));

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ onChange }: any) => (
    <input data-testid="collectionId" onChange={(e) => onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const helpers = require('../../../../components/nextGen/nextgen_helpers');

function setup() {
  return render(<NextGenAdminSetCosts close={() => {}} />);
}

describe('NextGenAdminSetCosts', () => {
  it('shows validation errors when fields empty', () => {
    setup();
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Collection id is required')).toBeInTheDocument();
    expect(screen.getByText('Starting price is required')).toBeInTheDocument();
  });

  it('calls writeContract with provided values', async () => {
    const user = userEvent.setup();
    setup();
    const contract = helpers.useMinterContractWrite.mock.results[0].value;
    await user.type(screen.getByTestId('collectionId'), '1');
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '10');
    await user.type(inputs[1], '20');
    await user.type(inputs[2], '1');
    await user.type(inputs[3], '2');
    await user.type(inputs[4], '3');
    await user.type(inputs[5], '0x2');
    await user.click(screen.getByText('Submit'));
    expect(contract.reset).toHaveBeenCalled();
    await waitFor(() => expect(contract.writeContract).toHaveBeenCalledWith({
      ...contract.params,
      args: ['1', '10', '20', '1', '2', '3', '0x2'],
    }));
  });
});
