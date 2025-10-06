import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import UserPageHeaderEditBanner from '@/components/user/user-page-header/banner/UserPageHeaderEditBanner';
import { ApiIdentity } from '@/generated/models/ApiIdentity';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';

let capturedBgProps: any;
let capturedSaveProps: any;

jest.mock('@/components/user/settings/UserSettingsBackground', () => (props: any) => {
  capturedBgProps = props;
  return <div data-testid="background" />;
});

jest.mock('@/components/user/settings/UserSettingsSave', () => (props: any) => {
  capturedSaveProps = props;
  return (
    <button data-testid="save" type="submit" disabled={props.disabled}>
      save
    </button>
  );
});

jest.mock('react-use', () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

const mutateAsync = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync }),
}));

const profile: ApiIdentity = {
  handle: 'alice',
  classification: 'Pseudonym' as any,
  banner1: '#111111',
  banner2: '#222222',
  primary_wallet: '0xabc',
  pfp: 'pfp',
} as any;

function renderComponent() {
  return render(
    <AuthContext.Provider value={{ setToast: jest.fn(), requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any}>
      <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
        <UserPageHeaderEditBanner profile={profile} defaultBanner1="#000" defaultBanner2="#fff" onClose={jest.fn()} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
}

describe('UserPageHeaderEditBanner', () => {
  it('enables save when background changes and submits update', async () => {
    const user = userEvent.setup();
    renderComponent();
    expect(capturedSaveProps.disabled).toBe(true);

    act(() => {
      capturedBgProps.setBgColor1('#333333');
    });
    expect(capturedSaveProps.disabled).toBe(false);

    await user.click(screen.getByTestId('save'));

    expect(mutateAsync).toHaveBeenCalledWith({
      handle: 'alice',
      classification: 'Pseudonym',
      banner_1: '#333333',
      banner_2: '#222222',
      pfp_url: 'pfp',
    });
  });
});
