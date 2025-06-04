import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminSetFinalSupply from '../../../../components/nextGen/admin/NextGenAdminSetFinalSupply';

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(),
  useFunctionAdmin: jest.fn(),
  useCollectionIndex: jest.fn(),
  useCoreContractWrite: jest.fn(),
  useParsedCollectionIndex: jest.fn(),
  useCollectionAdmin: jest.fn(),
  getCollectionIdsForAddress: jest.fn(),
}));

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => {
  return function MockWriteStatus() {
    return <div data-testid="write-status">Write Status</div>;
  };
});

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, collection_ids, onChange }: any) => (
    <div data-testid="collection-form-group">
      <select
        value={collection_id}
        onChange={(e) => onChange(e.target.value)}
        data-testid="collection-select"
      >
        <option value="">Select Collection</option>
        {collection_ids.map((id: string) => (
          <option key={id} value={id}>
            Collection {id}
          </option>
        ))}
      </select>
    </div>
  ),
  NextGenAdminHeadingRow: ({ close, title }: any) => (
    <div data-testid="heading-row">
      <h1>{title}</h1>
      <button onClick={close} data-testid="close-button">Close</button>
    </div>
  ),
}));

jest.mock('../../../../components/nextGen/admin/NextGenAdmin', () => ({
  printAdminErrors: (errors: string[]) => (
    <div data-testid="admin-errors">
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  ),
}));

const mockHelpers = require('../../../../components/nextGen/nextgen_helpers');
const mockSeizeConnect = require('../../../../components/auth/SeizeConnectContext');

describe('NextGenAdminSetFinalSupply', () => {
  const mockProps = {
    close: jest.fn(),
  };

  const mockContractWrite = {
    writeContract: jest.fn(),
    reset: jest.fn(),
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: null,
    error: null,
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
      address: '0x123',
    });
    
    mockHelpers.useGlobalAdmin.mockReturnValue({ data: true });
    mockHelpers.useFunctionAdmin.mockReturnValue({ data: true });
    mockHelpers.useCollectionIndex.mockReturnValue('1,2,3');
    mockHelpers.useParsedCollectionIndex.mockReturnValue([1, 2, 3]);
    mockHelpers.useCollectionAdmin.mockReturnValue({ data: [1, 2] });
    mockHelpers.getCollectionIdsForAddress.mockReturnValue(['1', '2', '3']);
    mockHelpers.useCoreContractWrite.mockReturnValue(mockContractWrite);
  });

  it('renders the component with form elements', () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    expect(screen.getByText('Set Final Supply')).toBeInTheDocument();
    expect(screen.getByTestId('collection-form-group')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByTestId('write-status')).toBeInTheDocument();
  });

  it('calls close function when close button is clicked', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const closeButton = screen.getByTestId('close-button');
    await userEvent.click(closeButton);
    
    expect(mockProps.close).toHaveBeenCalled();
  });

  it('updates collection ID when selection changes', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const select = screen.getByTestId('collection-select');
    await userEvent.selectOptions(select, '2');
    
    expect(select).toHaveValue('2');
  });

  it('shows validation error when submitting without collection ID', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-errors')).toBeInTheDocument();
      expect(screen.getByText('Collection id is required')).toBeInTheDocument();
    });
  });

  it('calls contract write when valid collection ID is submitted', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const select = screen.getByTestId('collection-select');
    await userEvent.selectOptions(select, '2');
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockContractWrite.reset).toHaveBeenCalled();
      expect(mockContractWrite.writeContract).toHaveBeenCalledWith({
        ...mockContractWrite.params,
        args: ['2'],
      });
    });
  });

  it('disables submit button when submitting', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const select = screen.getByTestId('collection-select');
    await userEvent.selectOptions(select, '2');
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Initially enabled
    expect(submitButton).not.toBeDisabled();
    
    await userEvent.click(submitButton);
    
    // Should be disabled during submission
    expect(submitButton).toBeDisabled();
  });

  it('clears errors when valid submission occurs', async () => {
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    // First submit without collection ID to show error
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-errors')).toBeInTheDocument();
    });
    
    // Then select collection and submit
    const select = screen.getByTestId('collection-select');
    await userEvent.selectOptions(select, '2');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('admin-errors')).not.toBeInTheDocument();
    });
  });

  it('resets loading state when contract write succeeds', () => {
    const { rerender } = render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    // Mock successful contract write
    mockHelpers.useCoreContractWrite.mockReturnValue({
      ...mockContractWrite,
      isSuccess: true,
    });
    
    rerender(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).not.toBeDisabled();
  });

  it('resets loading state when contract write fails', () => {
    const { rerender } = render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    // Mock failed contract write
    mockHelpers.useCoreContractWrite.mockReturnValue({
      ...mockContractWrite,
      isError: true,
    });
    
    rerender(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).not.toBeDisabled();
  });

  it('passes available collection IDs to form group', () => {
    const mockCollectionIds = ['1', '2', '3'];
    mockHelpers.getCollectionIdsForAddress.mockReturnValue(mockCollectionIds);
    
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const select = screen.getByTestId('collection-select');
    expect(select).toHaveValue(''); // Default empty selection
    expect(screen.getByText('Collection 1')).toBeInTheDocument();
    expect(screen.getByText('Collection 2')).toBeInTheDocument();
    expect(screen.getByText('Collection 3')).toBeInTheDocument();
  });

  it('handles empty collection IDs list', () => {
    mockHelpers.getCollectionIdsForAddress.mockReturnValue([]);
    
    render(<NextGenAdminSetFinalSupply {...mockProps} />);
    
    const select = screen.getByTestId('collection-select');
    expect(select.children).toHaveLength(1); // Only default option
  });
});