import { render } from '@testing-library/react';
import UserPageGroupsWrapper from '../../../../components/user/groups/UserPageGroupsWrapper';
import { useRouter } from 'next/router';
import { useIdentity } from '../../../../hooks/useIdentity';

let capturedWrapperProfile: any = null;
let capturedGroupsProfile: any = null;

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));

jest.mock('../../../../components/user/utils/set-up-profile/UserPageSetUpProfileWrapper', () =>
  function MockWrapper({ profile, children }: any) {
    capturedWrapperProfile = profile;
    return <div data-testid="wrapper">{children}</div>;
  }
);

jest.mock('../../../../components/user/groups/UserPageGroups', () =>
  function MockGroups(props: any) {
    capturedGroupsProfile = props.profile;
    return <div data-testid="groups" />;
  }
);

describe('UserPageGroupsWrapper', () => {
  const useRouterMock = useRouter as jest.Mock;
  const useIdentityMock = useIdentity as jest.Mock;

  beforeEach(() => {
    capturedWrapperProfile = null;
    capturedGroupsProfile = null;
  });

  it('passes profile from hook when available', () => {
    useRouterMock.mockReturnValue({ query: { user: 'alice' } });
    const profile = { handle: 'alice' } as any;
    useIdentityMock.mockReturnValue({ profile });
    render(<UserPageGroupsWrapper profile={profile} />);
    expect(useIdentityMock).toHaveBeenCalledWith({ handleOrWallet: 'alice', initialProfile: profile });
    expect(capturedWrapperProfile).toBe(profile);
    expect(capturedGroupsProfile).toBe(profile);
  });

  it('falls back to initial profile when hook returns null', () => {
    useRouterMock.mockReturnValue({ query: { user: 'bob' } });
    const initialProfile = { handle: 'bob' } as any;
    useIdentityMock.mockReturnValue({ profile: null });
    render(<UserPageGroupsWrapper profile={initialProfile} />);
    expect(capturedWrapperProfile).toBe(initialProfile);
    expect(capturedGroupsProfile).toBeNull();
  });
});
