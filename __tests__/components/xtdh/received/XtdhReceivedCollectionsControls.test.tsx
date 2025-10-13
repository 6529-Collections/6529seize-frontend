import { fireEvent, render, screen, within } from "@testing-library/react";

import { SortDirection } from "@/entities/ISort";
import {
  XtdhReceivedCollectionsControls,
  type XtdhActiveFilterChip,
} from "@/components/xtdh/received/subcomponents";

jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => ({
  __esModule: true,
  default: ({ items, setSelected }: any) => (
    <button
      type="button"
      data-testid="sort-dropdown"
      onClick={() => setSelected(items[0].value)}
    >
      Sort Dropdown
    </button>
  ),
}));

jest.mock(
  "@/components/xtdh/received/subcomponents/XtdhReceivedViewToggle",
  () => ({
    XtdhReceivedViewToggle: ({ announcement }: any) => (
      <div data-testid="view-toggle">{announcement}</div>
    ),
  }),
);

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ children, isOpen }: any) =>
    isOpen ? <div data-testid="mobile-dialog">{children}</div> : null,
}));

const baseProps = {
  resultSummary: "Showing 3 of 10 collections",
  searchQuery: "",
  onSearchChange: jest.fn(),
  ownershipFilter: "all" as const,
  onOwnershipFilterChange: jest.fn(),
  isMyAllocationsActive: false,
  onToggleMyAllocations: jest.fn(),
  isTrendingActive: false,
  onToggleTrending: jest.fn(),
  isNewlyAllocatedActive: false,
  onToggleNewlyAllocated: jest.fn(),
  activeFilters: [] as XtdhActiveFilterChip[],
  filtersAreActive: false,
  isLoading: false,
  activeSort: "total_rate" as const,
  activeDirection: SortDirection.DESC,
  onSortChange: jest.fn(),
  onResetFilters: jest.fn(),
  view: "collections" as const,
  onViewChange: jest.fn(),
  announcement: "toggle",
  clearFiltersLabel: "Reset filters",
};

describe("XtdhReceivedCollectionsControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders primary controls and active filters summary", () => {
    const removeTrending = jest.fn();
    render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        activeFilters={[
          { label: "Trending", onRemove: removeTrending },
          { label: "Mine" },
        ]}
        filtersAreActive={true}
      />,
    );

    expect(screen.getAllByTestId("sort-dropdown").length).toBeGreaterThan(0);
    expect(screen.getByText("Active Filters")).toBeInTheDocument();
    expect(screen.getAllByText("Trending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mine").length).toBeGreaterThan(0);
    const viewToggles = screen.getAllByTestId("view-toggle");
    expect(viewToggles.length).toBeGreaterThan(0);
    expect(viewToggles[0]).toHaveTextContent("toggle");

    fireEvent.click(
      screen.getByRole("button", { name: /Remove Trending/i })
    );
    expect(removeTrending).toHaveBeenCalledTimes(1);
  });

  it("invokes ownership toggles and discovery handlers", () => {
    const onOwnershipFilterChange = jest.fn();
    const onToggleTrending = jest.fn();
    const { rerender } = render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        onOwnershipFilterChange={onOwnershipFilterChange}
        onToggleTrending={onToggleTrending}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Granted" }));
    expect(onOwnershipFilterChange).toHaveBeenCalledWith("granted");

    rerender(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        ownershipFilter="granted"
        onOwnershipFilterChange={onOwnershipFilterChange}
        onToggleTrending={onToggleTrending}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Granted" }));
    expect(onOwnershipFilterChange).toHaveBeenLastCalledWith("all");

    fireEvent.click(screen.getAllByRole("button", { name: "Trending" })[0]);
    expect(onToggleTrending).toHaveBeenCalledTimes(1);
  });

  it("opens mobile filters dialog and wires reset + apply actions", () => {
    render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        filtersAreActive={true}
        activeFilters={[{ label: "Mine" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    const dialog = screen.getByTestId("mobile-dialog");
    expect(dialog).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reset filters" })
    );
    expect(baseProps.onResetFilters).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
    expect(screen.queryByTestId("mobile-dialog")).not.toBeInTheDocument();
  });

  it("triggers sort change via dropdown interaction", () => {
    render(<XtdhReceivedCollectionsControls {...baseProps} />); 

    const [firstDropdown] = screen.getAllByTestId("sort-dropdown");
    fireEvent.click(firstDropdown);
    expect(baseProps.onSortChange).toHaveBeenCalledWith("total_rate");
  });

});
