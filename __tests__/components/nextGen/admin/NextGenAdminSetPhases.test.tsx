import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminSetPhases from '@/components/nextGen/admin/NextGenAdminSetPhases';

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(() => ({ data: true })),
  useFunctionAdmin: jest.fn(() => ({ data: true })),
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useParsedCollectionIndex: jest.fn(() => 1),
  useCollectionAdmin: jest.fn(() => ({ data: [] })),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useCollectionPhases: jest.fn(() => {}),
  useMinterContractWrite: jest.fn(),
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

const helpers = require('@/components/nextGen/nextgen_helpers');

describe('NextGenAdminSetPhases', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve([]) }));
    (helpers.useMinterContractWrite as jest.Mock).mockReturnValue({
      writeContract: jest.fn(),
      reset: jest.fn(),
      params: {},
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  });

  it('validates required fields', async () => {
    render(<NextGenAdminSetPhases close={()=>{}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Collection id is required')).toBeInTheDocument();
  });

  it('calls writeContract with provided data', async () => {
    const user = userEvent.setup();
    const mockWriteContract = jest.fn();
    const mockReset = jest.fn();
    
    (helpers.useMinterContractWrite as jest.Mock).mockReturnValue({
      writeContract: mockWriteContract,
      reset: mockReset,
      params: {},
      isLoading: false,
      isSuccess: false,
      isError: false,
    });

    render(<NextGenAdminSetPhases close={()=>{}} />);
    
    await user.type(screen.getByTestId('collection'), '1');
    
    // Get all inputs with placeholder "Unix epoch time"
    const timeInputs = screen.getAllByPlaceholderText('Unix epoch time');
    
    // First input should be public start time, second should be public end time
    await user.type(timeInputs[0], '1000');
    await user.type(timeInputs[1], '2000');
    
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Verify no validation errors are shown
    expect(screen.queryByText('Collection id is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Public minting time is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Public minting end time is required')).not.toBeInTheDocument();
    
    // Wait for the async effect to trigger contract write
    await waitFor(() => {
      expect(mockWriteContract).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
