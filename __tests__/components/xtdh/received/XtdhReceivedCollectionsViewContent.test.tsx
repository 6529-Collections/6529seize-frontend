import { fireEvent, render, screen } from "@testing-library/react";

import { SortDirection } from "@/entities/ISort";
import { XtdhReceivedCollectionsViewContent } from "@/components/xtdh/received/subcomponents/XtdhReceivedCollectionsViewContent";
import type {
  XtdhReceivedCollectionsViewEmptyCopy,
  XtdhReceivedCollectionsViewState,
} from "@/components/xtdh/received/subcomponents/XtdhReceivedCollectionsView.types";

jest.mock(
  "@/components/xtdh/received/subcomponents/XtdhReceivedCollectionsList",
  () => ({
    XtdhReceivedCollectionsList: () => (
      <div data-testid="collections-list">collections</div>
    ),
  }),
);

jest.mock("@/components/utils/table/paginator/CommonTablePagination", () => ({
  __esModule: true,
  default: () => <div data-testid="pagination">pagination</div>,
}));

const emptyStateCopy: XtdhReceivedCollectionsViewEmptyCopy = {
  defaultMessage: "No collections",
  filtersMessage: "No collections match",
};

const baseState: XtdhReceivedCollectionsViewState = {
  missingScopeMessage: undefined,
  isLoading: false,
  isFetching: false,
  isError: false,
  errorMessage: undefined,
  collections: [],
  activeSort: "total_rate",
  activeDirection: SortDirection.DESC,
  filtersAreActive: false,
  resultSummary: "Showing 0 of 0",
  page: 1,
  totalPages: 1,
  haveNextPage: false,
  handleSortChange: jest.fn(),
  handlePageChange: jest.fn(),
  handleRetry: jest.fn(),
  expandedCollectionId: null,
  toggleCollection: jest.fn(),
  emptyStateCopy,
  clearFiltersLabel: "Reset filters",
  searchQuery: "",
  handleSearchChange: jest.fn(),
  ownershipFilter: "all",
  handleOwnershipFilterChange: jest.fn(),
  discoveryFilter: "none",
  handleDiscoveryFilterChange: jest.fn(),
  handleResetFilters: jest.fn(),
};

describe("XtdhReceivedCollectionsViewContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the desktop sort tabs above the grid and fires sort handler", () => {
    render(
      <XtdhReceivedCollectionsViewContent
        view="collections"
        onViewChange={jest.fn()}
        announcement="view-toggle"
        state={baseState}
        clearFiltersLabel="Reset filters"
        emptyStateCopy={emptyStateCopy}
        shouldShowPagination={false}
      />,
    );

    const sortTabs = screen.getByRole("tablist", {
      name: /sort collections/i,
    });
    expect(sortTabs).toBeInTheDocument();

    const totalTab = screen.getByRole("tab", { name: "Total" });
    fireEvent.click(totalTab);
    expect(baseState.handleSortChange).toHaveBeenCalledWith("total_received");

    expect(screen.getByTestId("collections-list")).toBeInTheDocument();
  });
});
