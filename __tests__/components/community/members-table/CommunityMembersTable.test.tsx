import { render, screen } from '@testing-library/react';
import React from 'react';
import CommunityMembersTable from '@/components/community/members-table/CommunityMembersTable';
import { CommunityMemberOverview } from '@/entities/IProfile';
import { CommunityMembersSortOption } from '@/enums';
import { SortDirection } from '@/entities/ISort';

jest.mock('@/components/community/members-table/CommunityMembersTableHeader', () => ({
  __esModule: true,
  default: (props: any) => (
    <thead data-testid="header">
      <tr>
        <td>{`header-${props.activeSort}-${props.sortDirection}-${String(props.isLoading)}`}</td>
      </tr>
    </thead>
  ),
}));

jest.mock('@/components/community/members-table/CommunityMembersTableRow', () => ({
  __esModule: true,
  default: ({ rank, member }: any) => (
    <tr data-testid="row">
      <td>{`${rank}-${member.display}`}</td>
    </tr>
  ),
}));

jest.mock('@/components/community/members-table/CommunityMembersMobileFilterBar', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="filter">filter-{props.activeSort}-{props.sortDirection}-{String(props.isLoading)}</div>,
}));

jest.mock('@/components/community/members-table/CommunityMembersMobileCard', () => ({
  __esModule: true,
  default: ({ rank, member }: any) => <div data-testid="mobile-card">{rank}-{member.display}</div>,
}));

const members: CommunityMemberOverview[] = [
  {
    display: 'Alice',
    detail_view_key: 'alice',
    level: 1,
    tdh: 10,
    rep: 5,
    cic: 2,
    pfp: null,
    last_activity: null,
    wallet: '0x1',
  },
  {
    display: 'Bob',
    detail_view_key: 'bob',
    level: 2,
    tdh: 20,
    rep: 15,
    cic: 3,
    pfp: null,
    last_activity: null,
    wallet: '0x2',
  },
];

const baseProps = {
  members,
  activeSort: CommunityMembersSortOption.REP,
  sortDirection: SortDirection.ASC,
  page: 2,
  pageSize: 5,
  isLoading: false,
  onSort: jest.fn(),
};

describe('CommunityMembersTable', () => {
  it('renders rows and passes props to header and filter bar', () => {
    render(<CommunityMembersTable {...baseProps} />);

    const rows = screen.getAllByTestId('row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('6-Alice');
    expect(rows[1]).toHaveTextContent('7-Bob');

    const cards = screen.getAllByTestId('mobile-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('6-Alice');
    expect(cards[1]).toHaveTextContent('7-Bob');

    expect(screen.getByTestId('header')).toHaveTextContent('header-rep-ASC-false');
    expect(screen.getByTestId('filter')).toHaveTextContent('filter-rep-ASC-false');
  });
});
