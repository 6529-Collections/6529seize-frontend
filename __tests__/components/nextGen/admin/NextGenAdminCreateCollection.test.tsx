import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenAdminCreateCollection from '@/components/nextGen/admin/NextGenAdminCreateCollection';

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => (
    <input data-testid={title} value={value} onChange={e => setValue(e.target.value)} />
  ),
  NextGenAdminScriptsFormGroup: ({ setScripts }: any) => (
    <button data-testid="script" onClick={() => setScripts(['s'])} />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />
}));

jest.mock('@/components/nextGen/nextgen_helpers', () => ({ useCoreContractWrite: jest.fn() }));
jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div data-testid="status" />);

const helpers = require('@/components/nextGen/nextgen_helpers');

describe('NextGenAdminCreateCollection', () => {
  beforeEach(() => {
    (helpers.useCoreContractWrite as jest.Mock).mockReturnValue({ writeContract: jest.fn(), reset: jest.fn(), params: {}, isSuccess:false,isError:false,isLoading:false });
  });

  it('shows validation errors', () => {
    render(<NextGenAdminCreateCollection close={() => {}} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Collection name is required')).toBeInTheDocument();
  });

  it('submits when valid', async () => {
    const user = userEvent.setup();
    render(<NextGenAdminCreateCollection close={() => {}} />);
    const contract = (helpers.useCoreContractWrite as jest.Mock).mock.results[0]?.value;
    const names = [
      'Collection Name','Artist','Description','Website','License','Base URI','Library','Dependency Script'
    ];
    for (const name of names) {
      await user.type(screen.getByTestId(name), 'x');
    }
    await user.click(screen.getByTestId('script'));
    await user.click(screen.getByText('Submit'));
  });
});
