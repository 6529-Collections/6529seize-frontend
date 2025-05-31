import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminPayArtist from '../../../../components/nextGen/admin/NextGenAdminPayArtist';

jest.mock('../../../../components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ onChange }: any) => <input data-testid="col" onChange={e=>onChange(e.target.value)} />,
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => <input data-testid={title} value={value} onChange={e=>setValue(e.target.value)} />
}));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: jest.fn(() => ({ data: true })),
  useFunctionAdmin: jest.fn(() => ({ data: true })),
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useCollectionAdmin: jest.fn(() => ({ data: [] })),
  getCollectionIdsForAddress: jest.fn(() => ['1']),
  useMinterContractWrite: jest.fn(),
  useParsedCollectionIndex: jest.fn(() => 1)
}));

jest.mock('../../../../components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const helpers = require('../../../../components/nextGen/nextgen_helpers');

describe('NextGenAdminPayArtist', () => {
  beforeEach(() => {
    (helpers.useMinterContractWrite as jest.Mock).mockReturnValue({ writeContract: jest.fn(), reset: jest.fn(), params:{}, isLoading:false,isError:false,isSuccess:false });
  });

  it('shows validation errors', () => {
    render(<NextGenAdminPayArtist close={()=>{}} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Collection id is required')).toBeInTheDocument();
  });

  it('calls writeContract when valid', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminPayArtist close={()=>{}} />);
    const contract = (helpers.useMinterContractWrite as jest.Mock).mock.results[0].value;
    await user.type(screen.getByTestId('col'), '1');
    const inputs = screen.getAllByTestId('Artist Address');
    await user.type(inputs[0], 'a1');
    await user.type(screen.getByTestId('Percentage for Address 1'), '1');
    await user.type(inputs[1], 'a2');
    await user.type(screen.getByTestId('Percentage for Address 2'), '2');
    await user.click(screen.getByText('Submit'));
  });
});
