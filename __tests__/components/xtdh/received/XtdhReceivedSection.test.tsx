import { render, screen } from "@testing-library/react";
import XtdhReceivedSection from "@/components/xtdh/received";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";
import { useXtdhCollectionsFilters } from "@/components/xtdh/received/hooks/useXtdhCollectionsFilters";
import { useXtdhCollectionSelection } from "@/components/xtdh/received/hooks/useXtdhCollectionSelection";

// Mock the hooks
jest.mock("@/hooks/useXtdhCollectionsQuery");
jest.mock("@/components/xtdh/received/hooks/useXtdhCollectionsFilters");
jest.mock("@/components/xtdh/received/hooks/useXtdhCollectionSelection");

// Mock child components to avoid deep rendering issues
jest.mock("@/components/xtdh/received/collections-controls", () => ({
  XtdhCollectionsControls: () => <div data-testid="xtdh-collections-controls" />,
}));
jest.mock("@/components/xtdh/received/subcomponents/XtdhCollectionsList", () => ({
  XtdhCollectionsList: () => <div data-testid="xtdh-collections-list" />,
}));
jest.mock("@/components/xtdh/received/collection-tokens", () => ({
  XtdhCollectionTokensPanel: () => <div data-testid="xtdh-collection-tokens-panel" />,
}));

const mockUseXtdhCollectionsQuery = useXtdhCollectionsQuery as jest.Mock;
const mockUseXtdhCollectionsFilters = useXtdhCollectionsFilters as jest.Mock;
const mockUseXtdhCollectionSelection = useXtdhCollectionSelection as jest.Mock;

describe("XtdhReceivedSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseXtdhCollectionsFilters.mockReturnValue({
      activeSortField: "xtdh",
      activeSortDirection: "desc",
      apiOrder: "desc",
      handleSortChange: jest.fn(),
    });

    mockUseXtdhCollectionSelection.mockReturnValue({
      selectedContract: null,
      handleCollectionSelect: jest.fn(),
      clearSelection: jest.fn(),
    });
  });

  it("renders controls when collections are present", () => {
    mockUseXtdhCollectionsQuery.mockReturnValue({
      collections: [{ contract: "0x123", xtdh: 100 }],
      isLoading: false,
      isError: false,
      isEnabled: true,
      hasNextPage: false,
    });

    render(<XtdhReceivedSection profileId="0x123" />);

    expect(screen.getByTestId("xtdh-collections-controls")).toBeInTheDocument();
    expect(screen.getByTestId("xtdh-collections-list")).toBeInTheDocument();
  });

  it("does NOT render controls when collections are empty", () => {
    mockUseXtdhCollectionsQuery.mockReturnValue({
      collections: [],
      isLoading: false,
      isError: false,
      isEnabled: true,
      hasNextPage: false,
    });

    render(<XtdhReceivedSection profileId="0x123" />);

    // This expectation defines the desired behavior
    expect(screen.queryByTestId("xtdh-collections-controls")).not.toBeInTheDocument();
    expect(screen.getByTestId("xtdh-collections-list")).toBeInTheDocument();
  });
});
