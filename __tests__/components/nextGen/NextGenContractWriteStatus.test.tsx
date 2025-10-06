import { render, screen, waitFor } from '@testing-library/react';
import NextGenContractWriteStatus from '@/components/nextGen/NextGenContractWriteStatus';
import { useWaitForTransactionReceipt } from 'wagmi';
import * as Helpers from '@/helpers/Helpers';

jest.mock('wagmi');
jest.mock('@/components/dotLoader/DotLoader', () => () => <span data-testid="loader" />);

const waitVal: any = { isLoading: false, isSuccess: false, data: undefined };
(useWaitForTransactionReceipt as jest.Mock).mockImplementation(() => waitVal);

jest.spyOn(Helpers, 'getTransactionLink').mockImplementation(() => 'tx-link');
jest.spyOn(Helpers, 'areEqualAddresses').mockImplementation((a, b) => a === b);

describe('NextGenContractWriteStatus', () => {
  afterEach(() => {
    waitVal.isSuccess = false;
    waitVal.data = undefined;
  });
  it('shows loading and error', () => {
    render(<NextGenContractWriteStatus isLoading={true} error={{}} />);
    expect(screen.getByText(/Confirm in your wallet/)).toBeInTheDocument();
  });

  it('renders token list and link', async () => {
    waitVal.data = { logs: [ { topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '',
      '0x000000000000000000000000000000000000000000000000000000000000000a'
    ] } ] };
    render(<NextGenContractWriteStatus isLoading={false} hash="0x1" error={null} />);
    await waitFor(() => screen.getByText('#10'));
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', 'tx-link');
  });

  it('calls onSuccess when finished', () => {
    const onSuccess = jest.fn();
    waitVal.isSuccess = true;
    render(<NextGenContractWriteStatus isLoading={false} hash="0x1" error={null} onSuccess={onSuccess} />);
    expect(onSuccess).toHaveBeenCalled();
  });
});
