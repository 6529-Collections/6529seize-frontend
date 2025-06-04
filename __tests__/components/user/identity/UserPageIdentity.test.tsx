import { render } from '@testing-library/react';
import React from 'react';
import UserPageIdentity from '../../../../components/user/identity/UserPageIdentity';

let headerProps: any;
let statementsProps: any;
let tableParams: any[] = [];
let activityProps: any;

jest.mock('../../../../components/user/identity/header/UserPageIdentityHeader', () => (props: any) => { headerProps = props; return <div data-testid="header" />; });
jest.mock('../../../../components/user/identity/statements/UserPageIdentityStatements', () => (props: any) => { statementsProps = props; return <div data-testid="statements" />; });
jest.mock('../../../../components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper', () => (props: any) => { tableParams.push(props.initialParams); return <div data-testid="table" />; });
jest.mock('../../../../components/user/identity/activity/UserPageIdentityActivityLog', () => (props: any) => { activityProps = props; return <div data-testid="activity" />; });

describe('UserPageIdentity', () => {
  beforeEach(() => { headerProps = undefined; statementsProps = undefined; tableParams = []; activityProps = undefined; });
  it('passes props to children', () => {
    const profile = { id: '1' } as any;
    const params = { p: 1 } as any;
    render(
      <UserPageIdentity
        profile={profile}
        initialCICReceivedParams={params}
        initialCICGivenParams={params}
        initialActivityLogParams={params}
      />
    );
    expect(headerProps.profile).toBe(profile);
    expect(statementsProps.profile).toBe(profile);
    expect(tableParams).toEqual([params, params]);
    expect(activityProps.initialActivityLogParams).toBe(params);
  });
});
