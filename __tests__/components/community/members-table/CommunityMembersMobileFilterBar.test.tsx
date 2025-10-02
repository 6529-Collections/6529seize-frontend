import { render, screen, fireEvent } from '@testing-library/react';
import CommunityMembersMobileFilterBar from '@/components/community/members-table/CommunityMembersMobileFilterBar';
import { CommunityMembersSortOption } from '@/enums';
import { SortDirection } from '@/entities/ISort';

jest.mock('@/components/user/utils/icons/CommonTableSortIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: 'SMALL' },
}));

const defaultProps = {
  activeSort: CommunityMembersSortOption.LEVEL,
  sortDirection: SortDirection.ASC,
  isLoading: false,
  onSort: jest.fn(),
};

describe('CommunityMembersMobileFilterBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders buttons and handles click', () => {
    render(<CommunityMembersMobileFilterBar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    fireEvent.click(screen.getByText('TDH'));
    expect(defaultProps.onSort).toHaveBeenCalledWith(CommunityMembersSortOption.TDH);
  });

  it('shows loader when active option is loading', () => {
    render(
      <CommunityMembersMobileFilterBar {...defaultProps} isLoading={true} />
    );
    // loader should appear next to active option
    const loader = screen.getByTestId('loader');
    expect(loader).toBeInTheDocument();
  });
});
