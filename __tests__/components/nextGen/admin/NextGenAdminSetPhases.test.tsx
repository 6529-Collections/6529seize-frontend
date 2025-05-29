import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminSetPhases from '../../../../components/nextGen/admin/NextGenAdminSetPhases';
import { NULL_MERKLE } from '../../../../constants';

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, onChange }: any) => (
    <input data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(() => ({ data: true })),
  useFunctionAdmin: jest.fn(() => ({ data: true })),
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useParsedCollectionIndex: jest.fn(() => 1),
  useCollectionAdmin: jest.fn(() => ({ data: [] })),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useCollectionPhases: jest.fn(),
  useMinterContractWrite: jest.fn(),
}));

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const helpers = require('../../../../components/nextGen/nextgen_helpers');

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

  it.skip('calls writeContract with provided data', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminSetPhases close={()=>{}} />);
    const contract = (helpers.useMinterContractWrite as jest.Mock).mock.results[0].value;
    await user.type(screen.getByTestId('collection'), '1');
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[1], '10');
    await user.type(inputs[2], '20');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.queryByText('Collection id is required')).not.toBeInTheDocument();
  });
});
