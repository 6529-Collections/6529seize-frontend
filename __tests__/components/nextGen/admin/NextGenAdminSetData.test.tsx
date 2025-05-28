import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminSetData from '../../../../components/nextGen/admin/NextGenAdminSetData';

// Mock dependencies
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../../components/nextGen/nextgen_helpers');

const { useSeizeConnectContext } = require('../../../../components/auth/SeizeConnectContext');
const {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  useParsedCollectionIndex,
  useCollectionAdditionalData,
  useCoreContractWrite,
  getCollectionIdsForAddress,
} = require('../../../../components/nextGen/nextgen_helpers');


jest.mock('../../../../components/nextGen/nextgen_contracts', () => ({
  FunctionSelectors: {
    SET_COLLECTION_DATA: 'setCollectionData',
  },
}));


jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => (
  <div data-testid="contract-write-status" />
));

jest.mock('../../../../components/nextGen/admin/NextGenAdmin', () => ({
  printAdminErrors: (errors: string[]) => (
    <div data-testid="admin-errors">
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  ),
}));

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <div data-testid="collection-id-form-group">
      <input
        data-testid="collection-id-input"
        value={collection_id}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
  NextGenAdminHeadingRow: ({ close, title }: any) => (
    <div data-testid="heading-row">
      <h2>{title}</h2>
      <button data-testid="close-btn" onClick={close}>
        Close
      </button>
    </div>
  ),
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => (
    <div data-testid={`text-form-group-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      <label>{title}</label>
      <input
        data-testid={`input-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  ),
}));

describe('NextGenAdminSetData', () => {
  const mockClose = jest.fn();
  const mockWriteContract = jest.fn();
  const mockReset = jest.fn();

  const defaultContractWrite = {
    writeContract: mockWriteContract,
    reset: mockReset,
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: null,
    error: null,
    params: { address: '0x123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0x123' });
    (useGlobalAdmin as jest.Mock).mockReturnValue({ data: false });
    (useFunctionAdmin as jest.Mock).mockReturnValue({ data: false });
    (useCollectionIndex as jest.Mock).mockReturnValue({ data: '1' });
    (useCollectionAdmin as jest.Mock).mockReturnValue({ data: [] });
    (useParsedCollectionIndex as jest.Mock).mockReturnValue(1);
    (useCollectionAdditionalData as jest.Mock).mockImplementation(() => {
      // Mock the hook but don't call callback automatically to avoid infinite loop
    });
    (useCoreContractWrite as jest.Mock).mockReturnValue(defaultContractWrite);
    (getCollectionIdsForAddress as jest.Mock).mockReturnValue(['1', '2', '3']);
  });

  describe('Component Rendering', () => {
    it('renders all form fields with correct labels', () => {
      render(<NextGenAdminSetData close={mockClose} />);

      expect(screen.getByText('Set Collection Data')).toBeInTheDocument();
      expect(screen.getByTestId('collection-id-form-group')).toBeInTheDocument();
      expect(screen.getByText('Artist Address')).toBeInTheDocument();
      expect(screen.getByText('Max # of purchases (public phase)')).toBeInTheDocument();
      expect(screen.getByText('Total Supply of Collection')).toBeInTheDocument();
      expect(screen.getByText(/Time, after minting is completed/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('renders heading row with close functionality', () => {
      render(<NextGenAdminSetData close={mockClose} />);

      expect(screen.getByTestId('heading-row')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('close-btn'));
      expect(mockClose).toHaveBeenCalled();
    });

    it('renders contract write status component', () => {
      render(<NextGenAdminSetData close={mockClose} />);

      expect(screen.getByTestId('contract-write-status')).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates collection ID when selection changes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      await user.type(collectionIdInput, '2');

      expect(collectionIdInput).toHaveValue('2');
    });

    it('updates artist address when input changes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const artistAddressInput = screen.getByTestId('input-artist-address');
      await user.clear(artistAddressInput);
      await user.type(artistAddressInput, '0xdef');

      expect(artistAddressInput).toHaveValue('0xdef');
    });

    it('updates max purchases when input changes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const maxPurchasesInput = screen.getByTestId('input-max---of-purchases--public-phase-');
      await user.clear(maxPurchasesInput);
      await user.type(maxPurchasesInput, '10');

      expect(maxPurchasesInput).toHaveValue('10');
    });

    it('updates total supply when input changes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const totalSupplyInput = screen.getByTestId('input-total-supply-of-collection');
      await user.clear(totalSupplyInput);
      await user.type(totalSupplyInput, '2000');

      expect(totalSupplyInput).toHaveValue('2000');
    });

    it('updates final supply time when input changes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const finalSupplyTimeInput = screen.getByTestId('input-time--after-minting-is-completed--to-reduce-supply---unix-epoch-time-eg--86400--seconds-in-a-day-');
      await user.clear(finalSupplyTimeInput);
      await user.type(finalSupplyTimeInput, '172800');

      expect(finalSupplyTimeInput).toHaveValue('172800');
    });
  });

  describe('Collection Data Loading', () => {
    it('calls useCollectionAdditionalData with collection ID', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      await user.type(collectionIdInput, '1');

      expect(useCollectionAdditionalData).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors when required fields are empty', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByTestId('admin-errors')).toBeInTheDocument();
      });

      expect(screen.getByText('Collection id is required')).toBeInTheDocument();
      expect(screen.getByText('Artist ETH Address is required')).toBeInTheDocument();
      expect(screen.getByText('Max # of purchases during public mint is required')).toBeInTheDocument();
      expect(screen.getByText('Total Supply of collection must be greater than 0')).toBeInTheDocument();
      expect(screen.getByText('The time to reduce the supply, after minting is completed, is required')).toBeInTheDocument();
    });

    it('validates total supply is greater than 0', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      const artistAddressInput = screen.getByTestId('input-artist-address');
      const maxPurchasesInput = screen.getByTestId('input-max---of-purchases--public-phase-');
      const totalSupplyInput = screen.getByTestId('input-total-supply-of-collection');
      const finalSupplyTimeInput = screen.getByTestId('input-time--after-minting-is-completed--to-reduce-supply---unix-epoch-time-eg--86400--seconds-in-a-day-');

      await user.type(collectionIdInput, '1');
      await user.type(artistAddressInput, '0xabc');
      await user.type(maxPurchasesInput, '5');
      await user.type(totalSupplyInput, '0');
      await user.type(finalSupplyTimeInput, '86400');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Total Supply of collection must be greater than 0')).toBeInTheDocument();
      });
    });

    it('does not show errors when all fields are valid', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      const artistAddressInput = screen.getByTestId('input-artist-address');
      const maxPurchasesInput = screen.getByTestId('input-max---of-purchases--public-phase-');
      const totalSupplyInput = screen.getByTestId('input-total-supply-of-collection');
      const finalSupplyTimeInput = screen.getByTestId('input-time--after-minting-is-completed--to-reduce-supply---unix-epoch-time-eg--86400--seconds-in-a-day-');

      await user.type(collectionIdInput, '1');
      await user.type(artistAddressInput, '0xabc');
      await user.type(maxPurchasesInput, '5');
      await user.type(totalSupplyInput, '1000');
      await user.type(finalSupplyTimeInput, '86400');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('admin-errors')).not.toBeInTheDocument();
    });
  });

  describe('Contract Interaction', () => {
    it('calls writeContract with correct arguments when validation passes', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      const artistAddressInput = screen.getByTestId('input-artist-address');
      const maxPurchasesInput = screen.getByTestId('input-max---of-purchases--public-phase-');
      const totalSupplyInput = screen.getByTestId('input-total-supply-of-collection');
      const finalSupplyTimeInput = screen.getByTestId('input-time--after-minting-is-completed--to-reduce-supply---unix-epoch-time-eg--86400--seconds-in-a-day-');

      await user.type(collectionIdInput, '1');
      await user.type(artistAddressInput, '0xabc');
      await user.type(maxPurchasesInput, '5');
      await user.type(totalSupplyInput, '1000');
      await user.type(finalSupplyTimeInput, '86400');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: '0x123',
          args: ['1', '0xabc', '5', '1000', '86400'],
        });
      });
    });

    it('disables submit button during loading', async () => {
      const user = userEvent.setup();
      render(<NextGenAdminSetData close={mockClose} />);

      const collectionIdInput = screen.getByTestId('collection-id-input');
      const artistAddressInput = screen.getByTestId('input-artist-address');
      const maxPurchasesInput = screen.getByTestId('input-max---of-purchases--public-phase-');
      const totalSupplyInput = screen.getByTestId('input-total-supply-of-collection');
      const finalSupplyTimeInput = screen.getByTestId('input-time--after-minting-is-completed--to-reduce-supply---unix-epoch-time-eg--86400--seconds-in-a-day-');

      await user.type(collectionIdInput, '1');
      await user.type(artistAddressInput, '0xabc');
      await user.type(maxPurchasesInput, '5');
      await user.type(totalSupplyInput, '1000');
      await user.type(finalSupplyTimeInput, '86400');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    it('resets loading state on contract success', () => {
      (useCoreContractWrite as jest.Mock).mockReturnValue({
        ...defaultContractWrite,
        isSuccess: true,
      });

      render(<NextGenAdminSetData close={mockClose} />);

      expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    it('resets loading state on contract error', () => {
      (useCoreContractWrite as jest.Mock).mockReturnValue({
        ...defaultContractWrite,
        isError: true,
        error: new Error('Contract error'),
      });

      render(<NextGenAdminSetData close={mockClose} />);

      expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });
  });

  describe('Hooks Integration', () => {
    it('calls useCoreContractWrite with correct function name', () => {
      render(<NextGenAdminSetData close={mockClose} />);

      expect(useCoreContractWrite).toHaveBeenCalledWith(
        'setCollectionData',
        expect.any(Function)
      );
    });

    it('calls hooks with correct parameters', () => {
      render(<NextGenAdminSetData close={mockClose} />);

      expect(useSeizeConnectContext).toHaveBeenCalled();
      expect(useGlobalAdmin).toHaveBeenCalledWith('0x123');
      expect(useFunctionAdmin).toHaveBeenCalledWith('0x123', 'setCollectionData');
      expect(useCollectionAdmin).toHaveBeenCalledWith('0x123', 1);
      expect(getCollectionIdsForAddress).toHaveBeenCalledWith(false, false, [], 1);
    });
  });
});