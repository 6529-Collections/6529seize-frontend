import { render } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useIdentity } from '../../../../hooks/useIdentity';
import UserPageRepWrapper from '../../../../components/user/rep/UserPageRepWrapper';

let capturedWrapperProfile: any = null;
let capturedRepProfile: any = null;

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));

jest.mock('../../../../components/user/utils/set-up-profile/UserPageSetUpProfileWrapper', () =>
  function MockWrapper({ profile, children }: any) {
    capturedWrapperProfile = profile;
    return <div data-testid="wrapper">{children}</div>;
  }
);

jest.mock('../../../../components/user/rep/UserPageRep', () =>
  function MockRep(props: any) {
    capturedRepProfile = props.profile;
    return <div data-testid="rep" />;
  }
);

describe('UserPageRepWrapper', () => {
  const useRouterMock = useRouter as jest.Mock;
  const useIdentityMock = useIdentity as jest.Mock;

  beforeEach(() => {
    capturedWrapperProfile = null;
    capturedRepProfile = null;
  });

  it('uses profile from hook when available', () => {
    const profile = { handle: 'alice' } as any;
    useRouterMock.mockReturnValue({ query: { user: 'alice' } });
    useIdentityMock.mockReturnValue({ profile });
    render(
      <UserPageRepWrapper
        profile={profile}
        initialRepReceivedParams={{} as any}
        initialRepGivenParams={{} as any}
        initialActivityLogParams={{} as any}
      />
    );
    expect(useIdentityMock).toHaveBeenCalledWith({ handleOrWallet: 'alice', initialProfile: profile });
    expect(capturedWrapperProfile).toBe(profile);
    expect(capturedRepProfile).toBe(profile);
  });

  it('falls back to initial profile when hook returns null', () => {
    const initialProfile = { handle: 'bob' } as any;
    useRouterMock.mockReturnValue({ query: { user: 'bob' } });
    useIdentityMock.mockReturnValue({ profile: null });
    render(
      <UserPageRepWrapper
        profile={initialProfile}
        initialRepReceivedParams={{} as any}
        initialRepGivenParams={{} as any}
        initialActivityLogParams={{} as any}
      />
    );
    expect(capturedWrapperProfile).toBe(initialProfile);
    expect(capturedRepProfile).toBe(initialProfile);
  });
});
