import UserPageCollectedFilters from "@/components/user/collected/filters/UserPageCollectedFilters";
import type { CollectionSeized } from "@/entities/IProfile";
import { CollectedCollectionType, CollectionSort } from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";

jest.mock("@/components/nft-transfer/TransferToggle", () => {
  return function MockTransferToggle() {
    return <div data-testid="transfer-toggle">Transfer Toggle</div>;
  };
});

jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => {
  return {
    __esModule: true,
    default: function MockCommonSelect({
      activeItem,
      setSelected,
      filterLabel,
    }: any) {
      return (
        <div data-testid="common-select">
          <button onClick={() => setSelected("NETWORK")}>
            {filterLabel}: {activeItem}
          </button>
        </div>
      );
    },
  };
});

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFiltersNativeDropdown",
  () => {
    return function MockUserPageCollectedFiltersNativeDropdown({
      selected,
      setSelected,
    }: any) {
      return (
        <div data-testid="collection-filter">
          <button onClick={() => setSelected(CollectedCollectionType.MEMES)}>
            Collection Filter
          </button>
          Current: {selected || "none"}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFiltersNetworkCollection",
  () => {
    return function MockUserPageCollectedFiltersNetworkCollection({
      selected,
      setSelected,
    }: any) {
      return (
        <div data-testid="network-collection">
          <button onClick={() => setSelected("some-collection")}>
            Network Collection
          </button>
          Current: {selected || "none"}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFiltersSortBy",
  () => {
    return function MockUserPageCollectedFiltersSortBy({
      selected,
      setSelected,
    }: any) {
      return (
        <div data-testid="sort-by-filter">
          <button onClick={() => setSelected(CollectionSort.TOKEN_ID)}>
            Sort By Filter
          </button>
          Current: {selected || "none"}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFiltersSeized",
  () => {
    return function MockUserPageCollectedFiltersSeized({
      selected,
      setSelected,
    }: any) {
      return (
        <div data-testid="seized-filter">
          <button onClick={() => setSelected("seized")}>Seized Filter</button>
          Current: {selected || "none"}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/collected/filters/UserPageCollectedFiltersSzn",
  () => {
    return function MockUserPageCollectedFiltersSzn({
      selected,
      setSelected,
    }: any) {
      return (
        <div data-testid="szn-filter">
          <button onClick={() => setSelected({ id: 1, display: "SZN 1" })}>
            Season Filter
          </button>
          Current: {selected?.display || "none"}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/utils/addresses-select/UserAddressesSelectDropdown",
  () => {
    return function MockUserAddressesSelectDropdown({
      wallets,
      onActiveAddress,
    }: any) {
      return (
        <div data-testid="address-select">
          <button onClick={() => onActiveAddress("0x123")}>
            Address Select
          </button>
          Wallets: {wallets.length}
        </div>
      );
    };
  }
);

jest.mock(
  "@/components/user/collected/filters/user-page-collected-filters.helpers",
  () => {
    const { CollectedCollectionType } = jest.requireActual(
      "@/entities/IProfile"
    );
    return {
      COLLECTED_COLLECTIONS_META: {
        [CollectedCollectionType.MEMES]: {
          filters: {
            seized: true,
            szn: true,
          },
        },
        [CollectedCollectionType.GRADIENTS]: {
          filters: {
            seized: false,
            szn: false,
          },
        },
        [CollectedCollectionType.NETWORK]: {
          filters: {
            seized: false,
            szn: false,
          },
        },
      },
    };
  }
);

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("UserPageCollectedFilters", () => {
  const mockProfile: ApiIdentity = {
    id: "1",
    handle: "testuser",
    normalised_handle: "testuser",
    wallet: "0x123",
    display: "Test User",
    pfp: null,
    pfp_url: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    level: 1,
    consolidation_key: null,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    primary_wallet: "0x123",
    banner1: null,
    banner2: null,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    wallets: [
      { wallet: "0x123", display: "0x123", tdh: 0 },
      { wallet: "0x456", display: "0x456", tdh: 0 },
    ],
  } as unknown as ApiIdentity;

  const mockFilters = {
    collection: null as CollectedCollectionType | null,
    sortBy: CollectionSort.TOKEN_ID,
    sortDirection: SortDirection.ASC,
    seized: null as CollectionSeized | null,
    szn: null as MemeSeason | null,
    initialSznId: null as number | null,
    handleOrWallet: "testuser",
    accountForConsolidations: false,
    page: 1,
    pageSize: 20,
    subcollection: null,
  };

  const mockSetters = {
    clearFilters: jest.fn(),
    setCollection: jest.fn(),
    setSortBy: jest.fn(),
    setSeized: jest.fn(),
    setSzn: jest.fn(),
    setSubcollection: jest.fn(),
    showTransfer: false,
  };

  let mockContainerRef: RefObject<HTMLDivElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainerRef = {
      current: document.createElement("div"),
    };

    globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it("renders filters correctly", () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId("sort-by-filter")).toBeInTheDocument();
    expect(screen.getByTestId("address-select")).toBeInTheDocument();
  });

  it("shows seized filter when collection supports it", () => {
    const filtersWithMemes = {
      ...mockFilters,
      collection: CollectedCollectionType.MEMES,
    };

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithMemes}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId("seized-filter")).toBeInTheDocument();
  });

  it("shows season filter when collection supports it", () => {
    const filtersWithMemes = {
      ...mockFilters,
      collection: CollectedCollectionType.MEMES,
    };

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithMemes}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId("szn-filter")).toBeInTheDocument();
  });

  it("hides seized and season filters when collection does not support them", () => {
    const filtersWithGradients = {
      ...mockFilters,
      collection: CollectedCollectionType.GRADIENTS,
    };

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithGradients}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.queryByTestId("seized-filter")).not.toBeInTheDocument();
    expect(screen.queryByTestId("szn-filter")).not.toBeInTheDocument();
  });

  it("calls setSortBy when sort filter is used", () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    fireEvent.click(screen.getByText("Sort By Filter"));
    expect(mockSetters.setSortBy).toHaveBeenCalledWith(CollectionSort.TOKEN_ID);
  });

  it("keeps all controls visible and clears the selected filters", () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={{ ...mockFilters, collection: CollectedCollectionType.MEMES }}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );
    for (const id of [
      "collection-filter",
      "sort-by-filter",
      "seized-filter",
      "szn-filter",
      "address-select",
    ]) {
      expect(screen.getByTestId(id)).toBeVisible();
    }
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mockSetters.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("shows the active wallet scope in Network view too", () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={{
          ...mockFilters,
          collection: CollectedCollectionType.NETWORK,
        }}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );
    expect(screen.getByTestId("network-collection")).toBeVisible();
    expect(screen.getByTestId("address-select")).toBeVisible();
    expect(screen.queryByTestId("seized-filter")).not.toBeInTheDocument();
    expect(screen.queryByTestId("szn-filter")).not.toBeInTheDocument();
  });
});
