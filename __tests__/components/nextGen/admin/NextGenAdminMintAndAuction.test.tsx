import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminMintAndAuction from '@/components/nextGen/admin/NextGenAdminMintAndAuction';

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => (
    <input data-testid={title} value={value} onChange={e=>setValue(e.target.value)} />
  )
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(() => ({ data: true })),
  useFunctionAdmin: jest.fn(() => ({ data: true })),
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useParsedCollectionIndex: jest.fn(() => 1),
  useCollectionAdmin: jest.fn(() => ({ data: [] })),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useMinterContractWrite: jest.fn(),
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const helpers = require('@/components/nextGen/nextgen_helpers');

describe('NextGenAdminMintAndAuction', () => {
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

  it('shows validation error', async () => {
    render(<NextGenAdminMintAndAuction close={()=>{}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Recipient is required')).toBeInTheDocument();
  });

  it('submits without errors when valid', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminMintAndAuction close={()=>{}} />);
    await user.type(screen.getByTestId('Recipient'), 'r');
    await user.type(screen.getByTestId('Token Data'), 'd');
    await user.type(screen.getByTestId('Salt'), 's');
    await user.type(screen.getByTestId('collection'), '1');
    await user.type(screen.getByTestId('Auction End Time'), '10');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.queryByText('Recipient is required')).not.toBeInTheDocument()
    );
  });
});
