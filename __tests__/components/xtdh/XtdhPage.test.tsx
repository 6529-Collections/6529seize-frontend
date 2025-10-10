import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import XtdhPage from "@/components/xtdh/XtdhPage";

jest.mock("@/components/xtdh/XtdhStatsOverview", () => ({
  __esModule: true,
  default: () => <div data-testid="xtdh-stats-overview">xTDH stats overview</div>,
}));

const mockCollectionsResponse = {
  collections: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
  availableCollections: [],
};

const mockTokensResponse = {
  nfts: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
  availableCollections: [],
};

beforeEach(() => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation((input: RequestInfo | URL) => {
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

describe("XtdhPage", () => {
  it("renders the stats overview section", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <XtdhPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId("xtdh-stats-overview")
    ).toBeInTheDocument();
  });

  it("renders the received section description", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <XtdhPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        /Explore xTDH allocations across the ecosystem/i,
      ),
    ).toBeInTheDocument();
  });
});
