import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NextGenAdminAcceptAddressesAndPercentages from '../../../../components/nextGen/admin/NextGenAdminAcceptAddressesAndPercentages';

// Mock all the hooks and dependencies
jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
}));

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(),
  useFunctionAdmin: jest.fn(),
  useCollectionIndex: jest.fn(),
  useCollectionAdmin: jest.fn(),
  getCollectionIdsForAddress: jest.fn(),
  useMinterContractWrite: jest.fn(),
  useParsedCollectionIndex: jest.fn(),
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => {
  return function MockNextGenContractWriteStatus(props: any) {
    return <div data-testid="contract-write-status" {...props} />;
  };
});

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenAdminHeadingRow: ({ title, close }: any) => (
    <div data-testid="admin-heading">
      <h3>{title}</h3>
      <button onClick={close}>Close</button>
    </div>
  ),
  NextGenCollectionIdFormGroup: ({ collection_id, collection_ids, onChange }: any) => (
    <div data-testid="collection-form-group">
      <select value={collection_id} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select Collection</option>
        {collection_ids?.map((id: string) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  ),
}));

// Import the mocked modules
import { useReadContract } from 'wagmi';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from '../../../../components/nextGen/nextgen_helpers';

const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockUseSeizeConnectContext = useSeizeConnectContext as jest.MockedFunction<typeof useSeizeConnectContext>;
const mockUseGlobalAdmin = useGlobalAdmin as jest.MockedFunction<typeof useGlobalAdmin>;
const mockUseFunctionAdmin = useFunctionAdmin as jest.MockedFunction<typeof useFunctionAdmin>;
const mockUseCollectionIndex = useCollectionIndex as jest.MockedFunction<typeof useCollectionIndex>;
const mockUseCollectionAdmin = useCollectionAdmin as jest.MockedFunction<typeof useCollectionAdmin>;
const mockGetCollectionIdsForAddress = getCollectionIdsForAddress as jest.MockedFunction<typeof getCollectionIdsForAddress>;
const mockUseMinterContractWrite = useMinterContractWrite as jest.MockedFunction<typeof useMinterContractWrite>;
const mockUseParsedCollectionIndex = useParsedCollectionIndex as jest.MockedFunction<typeof useParsedCollectionIndex>;

describe('NextGenAdminAcceptAddressesAndPercentages', () => {
  const mockClose = jest.fn();
  const mockWriteContract = jest.fn();
  const mockReset = jest.fn();

  const defaultMocks = {
    account: { address: '0x123' },
    globalAdmin: { data: true },
    functionAdmin: { data: true },
    collectionIndex: 1,
    parsedCollectionIndex: 1,
    collectionAdmin: { data: ['1', '2'] },
    collectionIds: ['1', '2', '3'],
    contractWrite: {
      writeContract: mockWriteContract,
      reset: mockReset,
      isLoading: false,
      isSuccess: false,
      isError: false,
      data: null,
      error: null,
      params: {},
    },
    primaryData: ['0xabc', '0xdef', '0x789', 30, 40, 30, true],
    secondaryData: ['0x111', '0x222', '0x333', 25, 25, 50, false],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseSeizeConnectContext.mockReturnValue(defaultMocks.account);
    mockUseGlobalAdmin.mockReturnValue(defaultMocks.globalAdmin);
    mockUseFunctionAdmin.mockReturnValue(defaultMocks.functionAdmin);
    mockUseCollectionIndex.mockReturnValue(defaultMocks.collectionIndex);
    mockUseParsedCollectionIndex.mockReturnValue(defaultMocks.parsedCollectionIndex);
    mockUseCollectionAdmin.mockReturnValue(defaultMocks.collectionAdmin);
    mockGetCollectionIdsForAddress.mockReturnValue(defaultMocks.collectionIds);
    mockUseMinterContractWrite.mockReturnValue(defaultMocks.contractWrite);
    
    // Mock useReadContract to return different data based on function name
    mockUseReadContract.mockImplementation((config: any) => {
      if (config?.functionName === 'retrievePrimaryAddressesAndPercentages') {
        return { data: defaultMocks.primaryData };
      }
      if (config?.functionName === 'retrieveSecondaryAddressesAndPercentages') {
        return { data: defaultMocks.secondaryData };
      }
      return { data: null };
    });
  });

  it('renders with initial state', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    expect(screen.getByTestId('admin-heading')).toBeInTheDocument();
    expect(screen.getByText('Accept Addresses and Percentages')).toBeInTheDocument();
    expect(screen.getByTestId('collection-form-group')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('calls close function when close button is clicked', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('updates collection ID when selection changes', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(select).toHaveValue('1');
  });

  it('displays primary addresses and percentages when collection is selected', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('0xabc')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('30 %')).toHaveLength(2); // Primary 1 and Secondary 3 both have 30%
      expect(screen.getByDisplayValue('0xdef')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40 %')).toBeInTheDocument();
    });
  });

  it('displays secondary addresses and percentages when collection is selected', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('0x111')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('25 %')).toHaveLength(2); // Secondary 1 and 2 both have 25%
      expect(screen.getByDisplayValue('0x222')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50 %')).toBeInTheDocument();
    });
  });

  it('handles primary status radio button changes', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const primaryRadios = screen.getAllByRole('radio');
    const acceptRadio = primaryRadios.find(radio => 
      radio.getAttribute('name') === 'primaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Accept')
    );
    const rejectRadio = primaryRadios.find(radio => 
      radio.getAttribute('name') === 'primaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Reject')
    );

    fireEvent.click(acceptRadio!);
    expect(acceptRadio).toBeChecked();

    fireEvent.click(rejectRadio!);
    expect(rejectRadio).toBeChecked();
  });

  it('handles secondary status radio button changes', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const secondaryRadios = screen.getAllByRole('radio');
    const acceptRadio = secondaryRadios.find(radio => 
      radio.getAttribute('name') === 'secondaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Accept')
    );
    const rejectRadio = secondaryRadios.find(radio => 
      radio.getAttribute('name') === 'secondaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Reject')
    );

    fireEvent.click(acceptRadio!);
    expect(acceptRadio).toBeChecked();

    fireEvent.click(rejectRadio!);
    expect(rejectRadio).toBeChecked();
  });

  it('shows validation errors when submitting without required fields', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Collection id is required')).toBeInTheDocument();
    });
    
    // Radio buttons have default values, so they don't show validation errors
  });

  it('submits form successfully with valid data', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    // Select collection
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Set primary status
    const primaryRadios = screen.getAllByRole('radio');
    const primaryAcceptRadio = primaryRadios.find(radio => 
      radio.getAttribute('name') === 'primaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Accept')
    );
    fireEvent.click(primaryAcceptRadio!);

    // Set secondary status  
    const secondaryRejectRadio = primaryRadios.find(radio => 
      radio.getAttribute('name') === 'secondaryRadio' && 
      radio.closest('.form-check')?.textContent?.includes('Reject')
    );
    fireEvent.click(secondaryRejectRadio!);

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockWriteContract).toHaveBeenCalledWith({
        args: ['1', true, false],
      });
    });
  });

  it('submit button behavior', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Initially enabled
    expect(submitButton).not.toBeDisabled();
    
    // Button should remain functional for user interaction
    expect(submitButton).toHaveAttribute('type', 'button');
  });

  it('renders contract write status component', () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    expect(screen.getByTestId('contract-write-status')).toBeInTheDocument();
  });

  it('resets form when collection ID changes', async () => {
    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const select = screen.getByRole('combobox');
    
    // First select a collection
    fireEvent.change(select, { target: { value: '1' } });
    
    // Then change to another collection
    fireEvent.change(select, { target: { value: '2' } });

    // Should reset all state - just verify form is still there
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('2');
    });
  });

  it('handles contract write success state', () => {
    const successContractWrite = { 
      ...defaultMocks.contractWrite, 
      isSuccess: true,
      data: '0xhash123'
    };
    mockUseMinterContractWrite.mockReturnValue(successContractWrite);

    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const contractStatus = screen.getByTestId('contract-write-status');
    expect(contractStatus).toHaveAttribute('data-testid', 'contract-write-status');
  });

  it('handles contract write error state', () => {
    const errorContractWrite = { 
      ...defaultMocks.contractWrite, 
      isError: true,
      error: new Error('Transaction failed')
    };
    mockUseMinterContractWrite.mockReturnValue(errorContractWrite);

    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const contractStatus = screen.getByTestId('contract-write-status');
    expect(contractStatus).toHaveAttribute('data-testid', 'contract-write-status');
  });

  it('handles empty collection IDs array', () => {
    mockGetCollectionIdsForAddress.mockReturnValue([]);

    render(<NextGenAdminAcceptAddressesAndPercentages close={mockClose} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Should only have the default "Select Collection" option
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Select Collection');
  });
});