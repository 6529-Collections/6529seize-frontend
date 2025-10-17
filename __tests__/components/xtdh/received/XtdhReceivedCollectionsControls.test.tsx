import { fireEvent, render, screen, within } from "@testing-library/react";

import { SortDirection } from "@/entities/ISort";
import { XtdhReceivedCollectionsControls } from "@/components/xtdh/received/subcomponents";

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
  discoveryFilter: "none" as const,
  onDiscoveryFilterChange: jest.fn(),
  filtersAreActive: false,
  isLoading: false,
  activeSort: "total_rate" as const,
  activeDirection: SortDirection.DESC,
  onSortChange: jest.fn(),
  view: "collections" as const,
  onViewChange: jest.fn(),
  announcement: "toggle",
};

describe("XtdhReceivedCollectionsControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders primary controls layout", () => {
    render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        filtersAreActive={true}
      />,
    );

    expect(screen.getAllByTestId("sort-dropdown").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Filters/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Showing 3 of 10 collections"),
    ).toBeInTheDocument();
    const viewToggles = screen.getAllByTestId("view-toggle");
    expect(viewToggles.length).toBeGreaterThan(0);
    expect(viewToggles[0]).toHaveTextContent("toggle");
  });

  it("invokes ownership and discovery handlers via tabs", () => {
    const onOwnershipFilterChange = jest.fn();
    const onDiscoveryFilterChange = jest.fn();
    const { rerender } = render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        onOwnershipFilterChange={onOwnershipFilterChange}
        onDiscoveryFilterChange={onDiscoveryFilterChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Granted" }));
    expect(onOwnershipFilterChange).toHaveBeenCalledWith("granted");

    rerender(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        ownershipFilter="granted"
        onOwnershipFilterChange={onOwnershipFilterChange}
        onDiscoveryFilterChange={onDiscoveryFilterChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "All" }));
    expect(onOwnershipFilterChange).toHaveBeenLastCalledWith("all");

    fireEvent.click(screen.getByRole("tab", { name: "Trending" }));
    expect(onDiscoveryFilterChange).toHaveBeenCalledWith("trending");
  });

  it("opens mobile filters dialog and allows applying changes", () => {
    render(
      <XtdhReceivedCollectionsControls
        {...baseProps}
        filtersAreActive={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    const dialog = screen.getByTestId("mobile-dialog");
    expect(dialog).toBeInTheDocument();

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
