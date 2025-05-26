import { render, screen, fireEvent } from '@testing-library/react';
import CommunityMembersTableHeader from '../../../../components/community/members-table/CommunityMembersTableHeader';
import { CommunityMembersSortOption } from '../../../../enums';
import { SortDirection } from '../../../../entities/ISort';

const sortableMock = jest.fn();
jest.mock('../../../../components/community/members-table/CommunityMembersTableHeaderSortableContent', () => ({
  __esModule: true,
  default: (props: any) => { sortableMock(props); return <div data-testid={`content-${props.sort}`} />; }
}));

describe('CommunityMembersTableHeader', () => {
  const onSort = jest.fn();
  beforeEach(() => {
    sortableMock.mockClear();
    onSort.mockClear();
  });

  it('handles clicks and hover events', () => {
    render(
      <table>
        <CommunityMembersTableHeader
          activeSort={CommunityMembersSortOption.LEVEL}
          sortDirection={SortDirection.ASC}
          isLoading={false}
          onSort={onSort}
        />
      </table>
    );
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(7);

    // click on REP column (index 4)
    fireEvent.click(headers[4]);
    expect(onSort).toHaveBeenCalledWith(CommunityMembersSortOption.REP);

    // hover over Level column triggers prop
    fireEvent.mouseEnter(headers[2]);
    expect(sortableMock).toHaveBeenCalledWith(
      expect.objectContaining({ sort: CommunityMembersSortOption.LEVEL, hoveringOption: CommunityMembersSortOption.LEVEL })
    );
    fireEvent.mouseLeave(headers[2]);
    expect(sortableMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ hoveringOption: null })
    );
  });
});
