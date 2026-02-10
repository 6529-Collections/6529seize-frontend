import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminRegisterAdmin, { ADMIN_TYPE } from '@/components/nextGen/admin/NextGenAdminRegisterAdmin';

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
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useParsedCollectionIndex: jest.fn(() => 1),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useAdminContractWrite: jest.fn(),
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const helpers = require('@/components/nextGen/nextgen_helpers');

describe('NextGenAdminRegisterAdmin', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve([]) }));
    (helpers.useAdminContractWrite as jest.Mock).mockReturnValue({
      writeContract: jest.fn(),
      reset: jest.fn(),
      params: {},
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  });

  it('validates fields', async () => {
    render(<NextGenAdminRegisterAdmin close={()=>{}} type={ADMIN_TYPE.GLOBAL} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Address is required')).toBeInTheDocument();
  });

  it('submits when valid', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminRegisterAdmin close={()=>{}} type={ADMIN_TYPE.GLOBAL} />);
    await user.type(screen.getByTestId('Admin Address'), '0x2');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.queryByText('Address is required')).not.toBeInTheDocument()
    );
  });
});
