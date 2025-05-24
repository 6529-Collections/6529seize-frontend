import { render, screen, act } from '@testing-library/react';
import CommunityMembersTableHeaderSortableContent from '../../../../components/community/members-table/CommunityMembersTableHeaderSortableContent';
import { CommunityMembersSortOption } from '../../../../enums';
import { SortDirection } from '../../../../entities/ISort';

const sortIconMock = jest.fn();
jest.mock('../../../../components/user/utils/icons/CommonTableSortIcon', () => ({
  __esModule: true,
  default: (props: any) => {
    sortIconMock(props);
    return <div data-testid="sort-icon" />;
  },
}));

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: 'SMALL' },
}));

describe('CommunityMembersTableHeaderSortableContent', () => {
  const baseProps = {
    sort: CommunityMembersSortOption.LEVEL,
    activeSort: CommunityMembersSortOption.DISPLAY,
    sortDirection: SortDirection.ASC,
    hoveringOption: null as CommunityMembersSortOption | null,
    isLoading: false,
  };

  beforeEach(() => {
    sortIconMock.mockClear();
  });

  it('renders title and sort icon when inactive', () => {
    render(<CommunityMembersTableHeaderSortableContent {...baseProps} />);
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    expect(sortIconMock).toHaveBeenCalledWith(
      expect.objectContaining({ direction: SortDirection.DESC, isActive: false, shouldRotate: false })
    );
  });

  it('shows loader when active and loading', () => {
    render(
      <CommunityMembersTableHeaderSortableContent
        {...baseProps}
        activeSort={CommunityMembersSortOption.LEVEL}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('rotates icon when hovering active option', () => {
    const { rerender } = render(
      <CommunityMembersTableHeaderSortableContent
        {...baseProps}
        activeSort={CommunityMembersSortOption.LEVEL}
      />
    );
    expect(sortIconMock).toHaveBeenLastCalledWith(expect.objectContaining({ shouldRotate: false }));
    act(() => {
      rerender(
        <CommunityMembersTableHeaderSortableContent
          {...baseProps}
          activeSort={CommunityMembersSortOption.LEVEL}
          hoveringOption={CommunityMembersSortOption.LEVEL}
        />
      );
    });
    expect(sortIconMock).toHaveBeenLastCalledWith(expect.objectContaining({ shouldRotate: true }));
  });
});
