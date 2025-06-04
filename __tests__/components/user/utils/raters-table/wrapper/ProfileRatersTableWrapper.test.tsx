import React from 'react';
import { render, act } from '@testing-library/react';
import ProfileRatersTableWrapper, { ProfileRatersParamsOrderBy, ProfileRatersTableType } from '../../../../../../components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper';
import { RateMatter } from '../../../../../../entities/IProfile';
import { useRouter } from 'next/router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData: 'keepPreviousData' }));

let headerProps: any;
jest.mock('../../../../../../components/user/utils/raters-table/wrapper/ProfileRatersTableWrapperHeader', () => (props: any) => { headerProps = props; return <div data-testid="header" />; });
let tableProps: any;
jest.mock('../../../../../../components/user/utils/raters-table/ProfileRatersTable', () => (props: any) => { tableProps = props; return <div data-testid="table" />; });

jest.mock('../../../../../../components/utils/animation/CommonSkeletonLoader', () => () => <div data-testid="loader" />);

describe('ProfileRatersTableWrapper', () => {
  const pushMock = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ query: { user: 'bob' }, push: pushMock });

  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({ isLoading: false, isFetching: false, data: { count: 0, data: [] } });
  });

  it('computes table type based on matter and given', () => {
    render(
      <ProfileRatersTableWrapper
        initialParams={{ page:1, pageSize:10, given:false, order:'ASC' as any, orderBy: ProfileRatersParamsOrderBy.RATING, handleOrWallet:'bob', matter: RateMatter.REP }}
      />
    );
    expect(headerProps.type).toBe(ProfileRatersTableType.REP_RECEIVED);
    expect(tableProps.type).toBe(ProfileRatersTableType.REP_RECEIVED);
  });

  it('passes sorting callback to table', () => {
    render(
      <ProfileRatersTableWrapper
        initialParams={{ page:1, pageSize:10, given:true, order:'DESC' as any, orderBy: ProfileRatersParamsOrderBy.RATING, handleOrWallet:'bob', matter: RateMatter.NIC }}
      />
    );
    expect(headerProps.type).toBe(ProfileRatersTableType.CIC_GIVEN);
    act(() => {
      tableProps.onSortTypeClick(ProfileRatersParamsOrderBy.LAST_MODIFIED);
    });
    expect(tableProps.orderBy).toBe(ProfileRatersParamsOrderBy.LAST_MODIFIED);
  });
});
