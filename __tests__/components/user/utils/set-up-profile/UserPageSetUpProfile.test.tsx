import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageSetUpProfile from '../../../../../components/user/utils/set-up-profile/UserPageSetUpProfile';
import { AuthContext } from '../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../../../../components/user/utils/set-up-profile/UserPageSetUpProfileHeader', () => () => <div data-testid="header" />);
jest.mock('../../../../../components/user/settings/UserSettingsUsername', () => (props: any) => (
  <button
    data-testid="username"
    onClick={() => {
      props.setUserName('newname');
      props.setIsAvailable(true);
      props.setIsLoading(false);
    }}
  >
    username
  </button>
));
jest.mock('../../../../../components/user/settings/UserSettingsClassification', () => () => <div data-testid="classification" />);
jest.mock('../../../../../components/user/settings/UserSettingsPrimaryWallet', () => () => <div data-testid="primary-wallet" />);
jest.mock('../../../../../components/user/settings/UserSettingsSave', () => (props: any) => (
  <button data-testid="save" disabled={props.disabled}>save</button>
));
jest.mock('../../../../../services/api/common-api', () => ({
  commonApiPost: jest.fn(() => Promise.resolve({ handle: 'newname' })),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/[user]', replace: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: jest.fn() }),
}));

describe('UserPageSetUpProfile', () => {
  const profile: any = {
    handle: 'user',
    wallets: [
      { wallet: '0x1', tdh: 1 },
      { wallet: '0x2', tdh: 0 },
    ],
    primary_wallet: '0x1',
  };

  it('renders primary wallet selector when multiple wallets', () => {
    render(
      <AuthContext.Provider value={{ requestAuth: jest.fn(), setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
          <UserPageSetUpProfile profile={profile} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('primary-wallet')).toBeInTheDocument();
  });

  it('submits profile update on save', async () => {
    const user = userEvent.setup();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });
    const mutate = jest.fn();
    jest.spyOn(require('@tanstack/react-query'), 'useMutation').mockReturnValue({ mutateAsync: mutate } as any);
    render(
      <AuthContext.Provider value={{ requestAuth, setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
          <UserPageSetUpProfile profile={profile} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByTestId('username'));
    await user.click(screen.getByTestId('save'));
    expect(requestAuth).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalled();
  });
});
