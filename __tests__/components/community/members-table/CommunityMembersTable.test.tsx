import { render, screen } from '@testing-library/react';
import CommunityMembersTable from '@/components/community/members-table/CommunityMembersTable';
import type { ApiCommunityMemberOverview } from '@/generated/models/ApiCommunityMemberOverview';
import { ApiCommunityMembersSortOption } from '@/generated/models/ApiCommunityMembersSortOption';

jest.mock('@/components/community/members-table/CommunityMembersTableHeader', () => ({
  __esModule: true,
  default: () => (
    <thead data-testid="header">
      <tr>
        <td>header</td>
      </tr>
    </thead>
  ),
}));

jest.mock('@/components/community/members-table/CommunityMembersTableRow', () => ({
  __esModule: true,
  default: ({ rank, member }: { rank: number; member: ApiCommunityMemberOverview }) => (
    <tr data-testid="row">
      <td>{`${rank}-${member.display}`}</td>
    </tr>
  ),
}));

jest.mock('@/components/community/members-table/CommunityMembersMobileCard', () => ({
  __esModule: true,
  default: ({ rank, member }: { rank: number; member: ApiCommunityMemberOverview }) => (
    <div data-testid="mobile-card">{rank}-{member.display}</div>
  ),
}));

const members: ApiCommunityMemberOverview[] = [
  {
    display: 'Alice',
    detail_view_key: 'alice',
    level: 1,
    tdh: 10,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    combined_tdh: 10,
    combined_tdh_rate: 0,
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
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    combined_tdh: 20,
    combined_tdh_rate: 0,
    rep: 15,
    cic: 3,
    pfp: null,
    last_activity: null,
    wallet: '0x2',
  },
];

const baseProps = {
  members,
  page: 2,
  pageSize: 5,
  activeSort: ApiCommunityMembersSortOption.CombinedTdh,
};

describe('CommunityMembersTable', () => {
  it('renders rows with correct rank calculation', () => {
    render(<CommunityMembersTable {...baseProps} />);

    const rows = screen.getAllByTestId('row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('6-Alice');
    expect(rows[1]).toHaveTextContent('7-Bob');

    const cards = screen.getAllByTestId('mobile-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('6-Alice');
    expect(cards[1]).toHaveTextContent('7-Bob');

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
