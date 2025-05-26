import { render, screen } from '@testing-library/react';
import CommunityMembersTable from '../../../../components/community/members-table/CommunityMembersTable';
import { CommunityMembersSortOption } from '../../../../enums';
import { SortDirection } from '../../../../entities/ISort';

const headerMock = jest.fn(() => <thead data-testid="header" />);
jest.mock('../../../../components/community/members-table/CommunityMembersTableHeader', () => ({ __esModule: true, default: (props: any) => headerMock(props) }));

const rowMock = jest.fn((props: any) => <tr data-testid={`row-${props.rank}`} />);
jest.mock('../../../../components/community/members-table/CommunityMembersTableRow', () => ({ __esModule: true, default: (props: any) => rowMock(props) }));

const mobileFilterMock = jest.fn(() => <div data-testid="mobile-filter" />);
jest.mock('../../../../components/community/members-table/CommunityMembersMobileFilterBar', () => ({ __esModule: true, default: (props: any) => mobileFilterMock(props) }));

const mobileCardMock = jest.fn((props: any) => <div data-testid={`mobile-card-${props.rank}`} />);
jest.mock('../../../../components/community/members-table/CommunityMembersMobileCard', () => ({ __esModule: true, default: (props: any) => mobileCardMock(props) }));

const members = [
  {
    display: 'User One',
    detail_view_key: 'user1',
    level: 1,
    tdh: 10,
    rep: 20,
    cic: 30,
    pfp: null,
    last_activity: null,
    wallet: '0x1',
  },
  {
    display: 'User Two',
    detail_view_key: 'user2',
    level: 2,
    tdh: 15,
    rep: 25,
    cic: 35,
    pfp: null,
    last_activity: null,
    wallet: '0x2',
  },
];

const baseProps = {
  members,
  activeSort: CommunityMembersSortOption.LEVEL,
  sortDirection: SortDirection.ASC,
  page: 2,
  pageSize: 10,
  isLoading: false,
  onSort: jest.fn(),
};

describe('CommunityMembersTable', () => {
  beforeEach(() => {
    headerMock.mockClear();
    rowMock.mockClear();
    mobileFilterMock.mockClear();
    mobileCardMock.mockClear();
    (baseProps.onSort as jest.Mock).mockClear();
  });

  it('renders rows and mobile cards with correct rank', () => {
    render(<CommunityMembersTable {...baseProps} />);

    expect(headerMock).toHaveBeenCalledWith(expect.objectContaining({
      activeSort: baseProps.activeSort,
      sortDirection: baseProps.sortDirection,
      isLoading: baseProps.isLoading,
      onSort: baseProps.onSort,
    }));

    expect(rowMock).toHaveBeenCalledTimes(2);
    expect(rowMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ member: members[0], rank: 11 }));
    expect(rowMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ member: members[1], rank: 12 }));

    expect(mobileFilterMock).toHaveBeenCalledWith(expect.objectContaining({
      activeSort: baseProps.activeSort,
      sortDirection: baseProps.sortDirection,
      isLoading: baseProps.isLoading,
      onSort: baseProps.onSort,
    }));

    expect(mobileCardMock).toHaveBeenCalledTimes(2);
    expect(mobileCardMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ member: members[0], rank: 11 }));
    expect(mobileCardMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ member: members[1], rank: 12 }));

    // ensure elements rendered
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('row-11')).toBeInTheDocument();
    expect(screen.getByTestId('row-12')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-filter')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-card-11')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-card-12')).toBeInTheDocument();
  });
});
