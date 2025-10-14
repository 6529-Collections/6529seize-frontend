import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import { SortDirection } from "@/entities/ISort";
import type {
  XtdhReceivedCollectionSummary,
  XtdhReceivedCollectionsResponse,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";
import { useXtdhReceivedExplorer } from "@/components/xtdh/received/hooks";

interface ExplorerHarnessProps {
  readonly onUpdate: (state: ReturnType<typeof useXtdhReceivedExplorer>) => void;
}

function ExplorerHarness({ onUpdate }: ExplorerHarnessProps) {
  const explorer = useXtdhReceivedExplorer();

  useEffect(() => {
    onUpdate(explorer);
  }, [explorer, onUpdate]);

  return null;
}

const now = Date.now();

const baseCollection: Pick<
  XtdhReceivedCollectionSummary,
  | "collectionId"
  | "collectionName"
  | "collectionImage"
  | "collectionSlug"
  | "description"
  | "blockchain"
  | "contractAddress"
  | "tokenStandard"
  | "tokenCount"
  | "receivingTokenCount"
  | "totalXtdhRate"
  | "totalXtdhReceived"
  | "totalXtdhAllocated"
  | "grantorCount"
  | "grantCount"
  | "topGrantors"
  | "granters"
  | "holderSummaries"
  | "lastAllocatedAt"
  | "lastUpdatedAt"
  | "firstAllocatedAt"
  | "firstAllocationDaysAgo"
  | "rateChange7d"
  | "isGrantedByUser"
  | "isReceivedByUser"
  | "creatorName"
  | "creatorProfileId"
  | "creatorAvatar"
  | "tokens"
> = {
  collectionImage: "/placeholder.png",
  collectionSlug: "placeholder",
  description: "Test collection",
  blockchain: "ethereum",
  contractAddress: "0x000",
  tokenStandard: "ERC721",
  tokenCount: 5,
  receivingTokenCount: 5,
  totalXtdhRate: 0,
  totalXtdhReceived: 0,
  totalXtdhAllocated: 0,
  grantorCount: 0,
  grantCount: 0,
  topGrantors: [],
  granters: [],
  holderSummaries: [],
  lastAllocatedAt: new Date(now).toISOString(),
  lastUpdatedAt: new Date(now).toISOString(),
  firstAllocatedAt: new Date(now).toISOString(),
  firstAllocationDaysAgo: 0,
  rateChange7d: 0,
  isGrantedByUser: false,
  isReceivedByUser: false,
  creatorName: "",
  creatorProfileId: "creator",
  creatorAvatar: "/avatar.png",
  tokens: [],
};

const mockCollectionsResponse: XtdhReceivedCollectionsResponse = {
  collections: [
    {
      ...baseCollection,
      collectionId: "alpha",
      collectionName: "Alpha Collection",
      creatorName: "Atlas",
      totalXtdhRate: 120,
      totalXtdhReceived: 1200,
      totalXtdhAllocated: 600,
      grantorCount: 6,
      grantCount: 6,
      rateChange7d: 0.32,
      firstAllocatedAt: new Date(now - 2 * 86_400_000).toISOString(),
      firstAllocationDaysAgo: 2,
      isGrantedByUser: true,
      isReceivedByUser: false,
    },
    {
      ...baseCollection,
      collectionId: "beta",
      collectionName: "Beta Collective",
      creatorName: "Beacon",
      totalXtdhRate: 80,
      totalXtdhReceived: 900,
      totalXtdhAllocated: 400,
      grantorCount: 4,
      grantCount: 4,
      rateChange7d: 0.1,
      firstAllocatedAt: new Date(now - 10 * 86_400_000).toISOString(),
      firstAllocationDaysAgo: 10,
      isGrantedByUser: false,
      isReceivedByUser: true,
    },
    {
      ...baseCollection,
      collectionId: "gamma",
      collectionName: "Gamma Gallery",
      creatorName: "Gala",
      totalXtdhRate: 95,
      totalXtdhReceived: 950,
      totalXtdhAllocated: 500,
      grantorCount: 5,
      grantCount: 5,
      rateChange7d: -0.02,
      firstAllocatedAt: new Date(now - 6 * 86_400_000).toISOString(),
      firstAllocationDaysAgo: 6,
      isGrantedByUser: true,
      isReceivedByUser: true,
    },
  ],
  totalCount: 3,
  page: 1,
  pageSize: 20,
  availableCollections: [
    { collectionId: "alpha", collectionName: "Alpha Collection", tokenCount: 5 },
    { collectionId: "beta", collectionName: "Beta Collective", tokenCount: 5 },
    { collectionId: "gamma", collectionName: "Gamma Gallery", tokenCount: 5 },
  ],
};

const mockTokensResponse: XtdhReceivedNftsResponse = {
  nfts: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
  availableCollections: mockCollectionsResponse.availableCollections,
};

beforeEach(() => {
  jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.startsWith("/api/xtdh/collections")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockCollectionsResponse,
      } as unknown as Response);
    }

    if (url.startsWith("/api/xtdh/tokens")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockTokensResponse,
      } as unknown as Response);
    }

    return Promise.resolve({
      ok: false,
      json: async () => ({ message: "Not found" }),
    } as unknown as Response);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useXtdhReceivedExplorer", () => {
  it("supports client-side search and relationship filters", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let latest: ReturnType<typeof useXtdhReceivedExplorer> | null = null;

    render(
      <QueryClientProvider client={queryClient}>
        <ExplorerHarness onUpdate={(state) => (latest = state)} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(latest?.collectionsState.isLoading).toBe(false));

    expect(latest?.collectionsState.collections).toHaveLength(3);

    act(() => {
      latest?.collectionsState.handleSearchChange("Alpha");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.collections).toHaveLength(1),
    );
    expect(latest?.collectionsState.collections[0].collectionId).toBe("alpha");

    act(() => {
      latest?.collectionsState.handleSearchChange("");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.collections).toHaveLength(3),
    );

    act(() => {
      latest?.collectionsState.handleOwnershipFilterChange("granted");
    });

    await waitFor(() =>
      expect(
        latest?.collectionsState.collections.every(
          (collection) => collection.isGrantedByUser,
        ),
      ).toBe(true),
    );

    act(() => {
      latest?.collectionsState.handleOwnershipFilterChange("all");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.collections).toHaveLength(3),
    );

    act(() => {
      latest?.collectionsState.handleDiscoveryFilterChange("new");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.collections).toHaveLength(2),
    );

    act(() => {
      latest?.collectionsState.handleDiscoveryFilterChange("none");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.collections).toHaveLength(3),
    );
  });

  it("supports trending sort and reset behaviour", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let latest: ReturnType<typeof useXtdhReceivedExplorer> | null = null;

    render(
      <QueryClientProvider client={queryClient}>
        <ExplorerHarness onUpdate={(state) => (latest = state)} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(latest?.collectionsState.isLoading).toBe(false));

    expect(latest?.collectionsState.activeSort).toBe("total_rate");
    expect(latest?.collectionsState.activeDirection).toBe(SortDirection.DESC);

    act(() => {
      latest?.collectionsState.handleDiscoveryFilterChange("trending");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.activeSort).toBe("rate_change_7d"),
    );
    expect(latest?.collectionsState.activeDirection).toBe(SortDirection.DESC);
    expect(latest?.collectionsState.collections[0].collectionId).toBe("alpha");

    act(() => {
      latest?.collectionsState.handleDiscoveryFilterChange("none");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.activeSort).toBe("total_rate"),
    );

    act(() => {
      latest?.collectionsState.handleSearchChange("Beta");
      latest?.collectionsState.handleOwnershipFilterChange("received");
    });

    await waitFor(() =>
      expect(latest?.collectionsState.filtersAreActive).toBe(true),
    );

    act(() => {
      latest?.collectionsState.handleResetFilters();
    });

    await waitFor(() =>
      expect(latest?.collectionsState.filtersAreActive).toBe(false),
    );
    expect(latest?.collectionsState.searchQuery).toBe("");
    expect(latest?.collectionsState.ownershipFilter).toBe("all");
    expect(latest?.collectionsState.discoveryFilter).toBe("none");
  });
});
