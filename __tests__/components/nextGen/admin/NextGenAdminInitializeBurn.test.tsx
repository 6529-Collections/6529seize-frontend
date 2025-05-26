import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminInitializeBurn from '../../../../components/nextGen/admin/NextGenAdminInitializeBurn';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useParsedCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useMinterContractWrite
} from '../../../../components/nextGen/nextgen_helpers';
import { useSignMessage, useReadContract } from 'wagmi';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../../../components/auth/SeizeConnectContext');
jest.mock('../../../../components/nextGen/nextgen_helpers');
jest.mock('wagmi');
jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status"/>);
jest.mock('../../../../services/6529api', () => ({ postData: jest.fn() }));
jest.mock('uuid');

const mockUseSeize = useSeizeConnectContext as jest.Mock;
const mockUseGlobalAdmin = useGlobalAdmin as jest.Mock;
const mockUseFunctionAdmin = useFunctionAdmin as jest.Mock;
const mockUseCollectionIndex = useCollectionIndex as jest.Mock;
const mockUseParsedCollectionIndex = useParsedCollectionIndex as jest.Mock;
const mockUseCollectionAdmin = useCollectionAdmin as jest.Mock;
const mockGetCollectionIds = getCollectionIdsForAddress as jest.Mock;
const mockUseMinterContractWrite = useMinterContractWrite as jest.Mock;
const mockUseSignMessage = useSignMessage as jest.Mock;
const mockUseReadContract = useReadContract as jest.Mock;
const mockUuid = uuidv4 as jest.Mock;

const signMessageFn = jest.fn();
const resetFn = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUuid.mockReturnValue('uuid-123');
  mockUseSeize.mockReturnValue({ address: '0xabc' });
  mockUseGlobalAdmin.mockReturnValue({ data: true });
  mockUseFunctionAdmin.mockReturnValue({ data: false });
  mockUseCollectionIndex.mockReturnValue({ data: 3 });
  mockUseParsedCollectionIndex.mockReturnValue(3);
  mockUseCollectionAdmin.mockReturnValue({ data: [] });
  mockGetCollectionIds.mockReturnValue(['1','2']);
  mockUseReadContract.mockReturnValue({ data: false });
  mockUseSignMessage.mockReturnValue({ signMessage: signMessageFn, reset: resetFn, isError: false, error: null, isSuccess: false, data: undefined });
  mockUseMinterContractWrite.mockReturnValue({ writeContract: jest.fn(), reset: jest.fn(), params:{}, isLoading:false, isSuccess:false, isError:false });
});

function renderComponent() {
  return render(<NextGenAdminInitializeBurn close={jest.fn()} />);
}

describe('NextGenAdminInitializeBurn', () => {
  it('lists collection options from helper', () => {
    renderComponent();
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(expect.arrayContaining(['1','2']));
  });

  it('shows validation errors when submitting empty', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText('Burn Collection id is required')).toBeInTheDocument();
    expect(screen.getByText('Mint Collection id is required')).toBeInTheDocument();
    expect(signMessageFn).not.toHaveBeenCalled();
  });

  it('signs message when form is valid', async () => {
    renderComponent();
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], '1');
    await userEvent.selectOptions(selects[1], '2');
    await userEvent.click(screen.getAllByRole('radio')[0]);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(signMessageFn).toHaveBeenCalledWith({ message: 'uuid-123' });
    expect(screen.getByText(/Syncing with DB/)).toBeInTheDocument();
  });
});
