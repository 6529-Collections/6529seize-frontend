import { render, screen, fireEvent } from '@testing-library/react';
import CommunityMembersTableHeader from '../../../../components/community/members-table/CommunityMembersTableHeader';
import { CommunityMembersSortOption } from '../../../../enums';
import { SortDirection } from '../../../../entities/ISort';

const mockSortable = jest.fn();
jest.mock('../../../../components/community/members-table/CommunityMembersTableHeaderSortableContent', () => ({
  __esModule: true,
  default: (props: any) => {
    mockSortable(props);
    return <div data-testid={`content-${props.sort}`} />;
  }
}));

describe('CommunityMembersTableHeader', () => {
  const baseProps = {
    activeSort: CommunityMembersSortOption.LEVEL,
    sortDirection: SortDirection.ASC,
    isLoading: false,
    onSort: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSort when header clicked', () => {
    render(<table><CommunityMembersTableHeader {...baseProps} /></table>);
    fireEvent.click(screen.getByTestId('content-rep').parentElement!);
    expect(baseProps.onSort).toHaveBeenCalledWith(CommunityMembersSortOption.REP);
  });

  it('passes hover option on mouse enter', () => {
    render(<table><CommunityMembersTableHeader {...baseProps} /></table>);
    const th = screen.getByTestId('content-nic').parentElement as HTMLElement;
    fireEvent.mouseEnter(th);
    expect(mockSortable).toHaveBeenCalledWith(
      expect.objectContaining({ hoveringOption: CommunityMembersSortOption.NIC })
    );
    fireEvent.mouseLeave(th);
    expect(mockSortable).toHaveBeenCalledWith(
      expect.objectContaining({ hoveringOption: null })
    );
  });

  it('forwards sort props to content component', () => {
    render(<table><CommunityMembersTableHeader {...baseProps} isLoading={true} /></table>);
    expect(mockSortable).toHaveBeenCalledWith(
      expect.objectContaining({
        activeSort: baseProps.activeSort,
        sortDirection: baseProps.sortDirection,
        isLoading: true,
      })
    );
  });
});
