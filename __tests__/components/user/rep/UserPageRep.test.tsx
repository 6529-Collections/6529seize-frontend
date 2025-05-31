import { render } from '@testing-library/react';
import React from 'react';
import UserPageRep from '../../../../components/user/rep/UserPageRep';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../../../components/auth/Auth';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

let headerProps: any;
let newRepProps: any;
let repsProps: any;
let tableParams: any[] = [];
let activityProps: any;
let rateWrapperProps: any;

jest.mock('../../../../components/user/rep/header/UserPageRepHeader', () => (props: any) => { headerProps = props; return <div data-testid="header" />; });
jest.mock('../../../../components/user/rep/new-rep/UserPageRepNewRep', () => (props: any) => { newRepProps = props; return <div data-testid="newrep" />; });
jest.mock('../../../../components/user/rep/reps/UserPageRepReps', () => (props: any) => { repsProps = props; return <div data-testid="reps" />; });
jest.mock('../../../../components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper', () => (props: any) => { tableParams.push(props.initialParams); return <div data-testid="table" />; });
jest.mock('../../../../components/user/rep/UserPageRepActivityLog', () => (props: any) => { activityProps = props; return <div data-testid="activity" />; });
jest.mock('../../../../components/user/utils/rate/UserPageRateWrapper', () => (props: any) => { rateWrapperProps = props; return <div data-testid="ratewrapper">{props.children}</div>; });

describe('UserPageRep', () => {
  const routerMock = useRouter as jest.Mock;
  const queryMock = useQuery as jest.Mock;

  beforeEach(() => {
    headerProps = newRepProps = repsProps = activityProps = rateWrapperProps = undefined;
    tableParams = [];
    routerMock.mockReturnValue({ query: { user: 'alice' } });
    queryMock.mockReturnValue({ data: { score: 1 } });
  });

  it('passes repRates and params to children', () => {
    const profile = { handle: 'alice' } as any;
    const params = { p: 1 } as any;
    render(
      <AuthContext.Provider value={{ connectedProfile: { handle: 'charlie' } } as any}>
        <UserPageRep
          profile={profile}
          initialRepReceivedParams={params}
          initialRepGivenParams={params}
          initialActivityLogParams={params}
        />
      </AuthContext.Provider>
    );
    expect(headerProps.repRates).toEqual({ score: 1 });
    expect(newRepProps.profile).toBe(profile);
    expect(newRepProps.repRates).toEqual({ score: 1 });
    expect(repsProps.profile).toBe(profile);
    expect(repsProps.repRates).toEqual({ score: 1 });
    expect(tableParams.slice(0, 2)).toEqual([params, params]);
    expect(activityProps.initialActivityLogParams).toBe(params);
    expect(rateWrapperProps.profile).toBe(profile);
  });
});
