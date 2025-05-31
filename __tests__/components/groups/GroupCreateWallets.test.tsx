import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateWallets, { GroupCreateWalletsType } from '../../../components/groups/page/create/config/wallets/GroupCreateWallets';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect', () => () => <div />);
jest.mock('../../../components/groups/page/create/config/wallets/CreateGroupWalletsEmma', () => () => <div />);
jest.mock('../../../components/groups/page/create/config/wallets/CreateGroupWalletsUpload', () => () => <div />);

describe('GroupCreateWallets', () => {
  const renderComp = (props?: Partial<React.ComponentProps<typeof GroupCreateWallets>>) => {
    const setWallets = jest.fn();
    render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreateWallets
          type={GroupCreateWalletsType.INCLUDE}
          wallets={['0x1','0x2']}
          walletsLimit={1}
          iAmIncluded={false}
          setWallets={setWallets}
          {...props}
        />
      </AuthContext.Provider>
    );
    return { setWallets };
  };

  it('shows over limit warning', () => {
    renderComp();
    expect(screen.getByText(/Maximum allowed wallets count/)).toBeInTheDocument();
  });

  it('removes wallets when remove button clicked', async () => {
    const user = userEvent.setup();
    const { setWallets } = renderComp({ walletsLimit:5 });
    await user.click(screen.getByLabelText('Remove wallets'));
    expect(setWallets).toHaveBeenLastCalledWith(null);
  });
});
