// @ts-nocheck
import { render } from '@testing-library/react';
import React from 'react';
import UserPageIdentityWrapper from '../../../../components/user/identity/UserPageIdentityWrapper';
import { useRouter } from 'next/router';
import { useIdentity } from '../../../../hooks/useIdentity';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));

let wrapperProfile: any;
let identityProps: any;

jest.mock('../../../../components/user/utils/set-up-profile/UserPageSetUpProfileWrapper', () => (props: any) => { wrapperProfile = props.profile; return <div data-testid="wrapper">{props.children}</div>; });
jest.mock('../../../../components/user/identity/UserPageIdentity', () => (props: any) => { identityProps = props; return <div data-testid="identity" />; });

describe('UserPageIdentityWrapper', () => {
  const routerMock = useRouter as jest.Mock;
  const useIdentityMock = useIdentity as jest.Mock;
  beforeEach(() => { wrapperProfile = null; identityProps = null; });

  it('uses profile from hook when available', () => {
    routerMock.mockReturnValue({ query: { user: 'alice' } });
    const profile: any = { handle: 'alice' };
    useIdentityMock.mockReturnValue({ profile });
    render(
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={{} as any}
        initialCICGivenParams={{} as any}
        initialActivityLogParams={{} as any}
      />
    );
    expect(useIdentityMock).toHaveBeenCalledWith({ handleOrWallet: 'alice', initialProfile: profile });
    expect(wrapperProfile).toBe(profile);
    expect(identityProps.profile).toBe(profile);
  });

  it('falls back to initial profile when hook returns null', () => {
    routerMock.mockReturnValue({ query: { user: 'bob' } });
    const profile: any = { handle: 'bob' };
    useIdentityMock.mockReturnValue({ profile: null });
    render(
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={{} as any}
        initialCICGivenParams={{} as any}
        initialActivityLogParams={{} as any}
      />
    );
    expect(wrapperProfile).toBe(profile);
    expect(identityProps.profile).toBe(profile);
  });
});
