// @ts-nocheck
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminInitializeBurn from '../../../../components/nextGen/admin/NextGenAdminInitializeBurn';

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="write-status" />);

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));

jest.mock('../../../../services/6529api', () => ({ postData: jest.fn() }));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(),
  useFunctionAdmin: jest.fn(),
  useCollectionIndex: jest.fn(),
  useCollectionAdmin: jest.fn(),
  useParsedCollectionIndex: jest.fn(),
  getCollectionIdsForAddress: jest.fn(),
  useMinterContractWrite: jest.fn(),
}));

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
  useSignMessage: jest.fn(),
}));

import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';
import { postData } from '../../../../services/6529api';
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  useParsedCollectionIndex,
  getCollectionIdsForAddress,
  useMinterContractWrite,
} from '../../../../components/nextGen/nextgen_helpers';
import { useReadContract, useSignMessage } from 'wagmi';

const signMessageState: any = {
  signMessage: jest.fn(),
  reset: jest.fn(),
  isError: false,
  isSuccess: false,
  data: undefined,
  error: undefined,
};

const contractWriteState: any = {
  writeContract: jest.fn(),
  reset: jest.fn(),
  params: { address: '0xabc', abi: [], chainId: 1, functionName: 'initializeBurn' },
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0x1' });
  (useGlobalAdmin as jest.Mock).mockReturnValue({ data: true });
  (useFunctionAdmin as jest.Mock).mockReturnValue({ data: true });
  (useCollectionIndex as jest.Mock).mockReturnValue({ data: 3 });
  (useParsedCollectionIndex as jest.Mock).mockReturnValue(3);
  (useCollectionAdmin as jest.Mock).mockReturnValue({ data: [] });
  (getCollectionIdsForAddress as jest.Mock).mockReturnValue(['1', '2']);
  (useSignMessage as jest.Mock).mockImplementation(() => signMessageState);
  (useReadContract as jest.Mock).mockReturnValue({ data: false });
  (useMinterContractWrite as jest.Mock).mockReturnValue(contractWriteState);
  process.env.API_ENDPOINT = 'http://api';
});

function renderComponent() {
  return render(<NextGenAdminInitializeBurn close={() => {}} />);
}

test('shows validation errors when required fields missing', () => {
  renderComponent();
  fireEvent.click(screen.getByText('Submit'));
  expect(screen.getByText('Burn Collection id is required')).toBeInTheDocument();
  expect(screen.getByText('Mint Collection id is required')).toBeInTheDocument();
});

test('calls signMessage when form is valid', async () => {
  const user = userEvent.setup();
  renderComponent();
  const selects = screen.getAllByRole('combobox');
  await user.selectOptions(selects[0], '1');
  await user.selectOptions(selects[1], '2');
  const radios = screen.getAllByRole('radio');
  await user.click(radios[0]);
  await user.click(screen.getByText('Submit'));
  expect(signMessageState.signMessage).toHaveBeenCalledWith({ message: 'test-uuid' });
});

test('writes contract after successful sign message and api call', async () => {
  (postData as jest.Mock).mockResolvedValue({ status: 200, response: {} });
  const user = userEvent.setup();
  const { rerender } = renderComponent();
  const selects = screen.getAllByRole('combobox');
  await user.selectOptions(selects[0], '1');
  await user.selectOptions(selects[1], '2');
  const radios = screen.getAllByRole('radio');
  await user.click(radios[0]);
  await user.click(screen.getByText('Submit'));
  signMessageState.isSuccess = true;
  signMessageState.data = 'sig';
  await act(async () => {
    rerender(<NextGenAdminInitializeBurn close={() => {}} />);
  });
  expect(postData).toHaveBeenCalled();
  await act(async () => {});
  expect(contractWriteState.writeContract).toHaveBeenCalledWith({
    ...contractWriteState.params,
    args: ['1', '2', true],
  });
});
