import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminUpdateCollection, { UpdateType } from '@/components/nextGen/admin/NextGenAdminUpdateCollection';

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ collection_id, collection_ids, onChange }: any) => (
    <select data-testid="collection" value={collection_id} onChange={e=>onChange(e.target.value)}>
      <option value="" />
      {collection_ids.map((c:string)=>(<option key={c} value={c}>{c}</option>))}
    </select>
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => (
    <input data-testid={title} value={value} onChange={e=>setValue(e.target.value)} />
  ),
  NextGenAdminScriptsFormGroup: ({ scripts, setScripts }: any) => (
    <input data-testid="scripts" value={scripts[0]||''} onChange={e=>setScripts([e.target.value])} />
  )
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

const contractWriteMock = {
  params: { foo: 'bar' },
  writeContract: jest.fn(),
  reset: jest.fn(),
  isLoading: false,
  isSuccess: false,
  isError: false,
};

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => '1',
  useParsedCollectionIndex: (v: any) => v,
  useCollectionAdmin: () => ({ data: true }),
  getCollectionIdsForAddress: () => ['1'],
  useCollectionInfo: jest.fn(),
  useCollectionLibraryAndScript: jest.fn(),
  useCoreContractWrite: () => contractWriteMock,
}));

const helpers = require('@/components/nextGen/nextgen_helpers');

describe('NextGenAdminUpdateCollection', () => {
  it('shows validation error when required fields missing', async () => {
    render(<NextGenAdminUpdateCollection type={UpdateType.UPDATE_INFO} close={jest.fn()} />);
    await userEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Collection id is required')).toBeInTheDocument();
  });

  it('calls writeContract with values', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminUpdateCollection type={UpdateType.UPDATE_INFO} close={jest.fn()} />);
    const write = helpers.useCoreContractWrite().writeContract;
    await user.selectOptions(screen.getByTestId('collection'), '1');
    await user.type(screen.getByTestId('Collection Name'), 'name');
    await user.type(screen.getByTestId('Artist'), 'artist');
    await user.type(screen.getByTestId('Description'), 'desc');
    await user.type(screen.getByTestId('Website'), 'web');
    await user.type(screen.getByTestId('License'), 'lic');
    await user.type(screen.getByTestId('Library'), 'lib');
    await user.type(screen.getByTestId('Dependency Script'), 'dep');
    await user.type(screen.getByTestId('Base URI'), 'uri');
    await user.type(screen.getByTestId('scripts'), 'scr');
    await userEvent.click(screen.getByText('Submit'));
    expect(write).toHaveBeenCalledWith({ foo: 'bar', args: ['1','name','artist','desc','web','lic','uri','lib','dep',1000000,['scr']] });
  });
});
