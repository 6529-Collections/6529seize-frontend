import { render, screen } from '@testing-library/react';
import CommunityMembersTableHeader from '@/components/community/members-table/CommunityMembersTableHeader';
import { ApiCommunityMembersSortOption } from '@/generated/models/ApiCommunityMembersSortOption';

describe('CommunityMembersTableHeader', () => {
  it('renders all column headers', () => {
    render(
      <table>
        <CommunityMembersTableHeader activeSort={ApiCommunityMembersSortOption.CombinedTdh} />
      </table>
    );

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('TDH')).toBeInTheDocument();
    expect(screen.getByText('xTDH')).toBeInTheDocument();
    expect(screen.getByText('Combined')).toBeInTheDocument();
    expect(screen.getByText('Grants')).toBeInTheDocument();
    expect(screen.getByText('Peer Score')).toBeInTheDocument();
    expect(screen.getByText('Last Seen')).toBeInTheDocument();
  });

  it('highlights active sort column for TDH', () => {
    render(
      <table>
        <CommunityMembersTableHeader activeSort={ApiCommunityMembersSortOption.Tdh} />
      </table>
    );

    const tdhHeader = screen.getByText('TDH');
    expect(tdhHeader).toHaveClass('tw-text-primary-300');
  });

  it('highlights active sort column for Combined TDH', () => {
    render(
      <table>
        <CommunityMembersTableHeader activeSort={ApiCommunityMembersSortOption.CombinedTdh} />
      </table>
    );

    const combinedHeader = screen.getByText('Combined');
    expect(combinedHeader).toHaveClass('tw-text-primary-300');
  });
});
