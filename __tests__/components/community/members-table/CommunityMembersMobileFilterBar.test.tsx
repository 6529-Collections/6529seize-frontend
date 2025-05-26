import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunityMembersMobileFilterBar from '../../../../components/community/members-table/CommunityMembersMobileFilterBar';
import { CommunityMembersSortOption } from '../../../../enums';
import { SortDirection } from '../../../../entities/ISort';

const sortIconMock = jest.fn();
jest.mock('../../../../components/user/utils/icons/CommonTableSortIcon', () => ({
  __esModule: true,
  default: (props: any) => { sortIconMock(props); return <div data-testid="icon" />; }
}));

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: 'SMALL' },
}));

describe('CommunityMembersMobileFilterBar', () => {
  const baseProps = {
    activeSort: CommunityMembersSortOption.LEVEL,
    sortDirection: SortDirection.ASC,
    isLoading: false,
    onSort: jest.fn(),
  };

  beforeEach(() => {
    sortIconMock.mockClear();
    (baseProps.onSort as jest.Mock).mockClear();
  });

  it('renders options and handles click', async () => {
    const user = userEvent.setup();
    render(<CommunityMembersMobileFilterBar {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    await user.click(buttons[1]);
    expect(baseProps.onSort).toHaveBeenCalledWith(CommunityMembersSortOption.TDH);
    expect(sortIconMock).toHaveBeenCalledWith(
      expect.objectContaining({ direction: baseProps.sortDirection, isActive: true })
    );
  });

  it('shows loader when active sort is loading', () => {
    render(<CommunityMembersMobileFilterBar {...baseProps} isLoading={true} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
