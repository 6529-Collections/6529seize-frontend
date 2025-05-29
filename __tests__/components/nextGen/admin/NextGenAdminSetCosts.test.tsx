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
  useMinterContractWrite: jest.fn(() => ({ writeContract: jest.fn(), reset: jest.fn(), params: {}, isSuccess: false, isError: false, isLoading: false })),
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
    
    // Fill out the form
    await user.type(screen.getByTestId('collectionId'), '1');
    
    const costInputs = screen.getAllByPlaceholderText('Cost in wei');
    await user.type(costInputs[0], '10'); // Starting price
    await user.type(costInputs[1], '20'); // Ending price
    
    await user.type(screen.getByPlaceholderText('either % or in wei'), '1');
    await user.type(screen.getByPlaceholderText('unix epoch time eg. 86400 (seconds in a day)'), '2');
    await user.type(screen.getByPlaceholderText('1. Fixed Price, 2. Exponential/Linear decrease, 3. Periodic Sale'), '3');
    
    const delegationInput = screen.getByPlaceholderText('0x...');
    await user.clear(delegationInput);
    await user.type(delegationInput, '0x2');
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);
    
    expect(contract.reset).toHaveBeenCalled();
    
    // Check that no validation errors are shown
    expect(screen.queryByText('Collection id is required')).toBeNull();
    expect(screen.queryByText('Starting price is required')).toBeNull();
  });
});
