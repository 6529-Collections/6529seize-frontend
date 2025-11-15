import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import XtdhPage from "@/components/xtdh/XtdhPage";

const mockFetchXtdhTokens = jest.fn();

jest.mock("@/services/api/xtdh", () => ({
  fetchXtdhTokens: (...args: unknown[]) => mockFetchXtdhTokens(...args),
  fetchXtdhTokenContributors: jest.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  mockFetchXtdhTokens.mockReset().mockResolvedValue({
    tokens: [],
    page: 1,
    hasNextPage: false,
  });
});

describe("XtdhPage", () => {
  it("renders the received section description", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <XtdhPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        /Explore live xTDH allocations across the network/i,
      ),
    ).toBeInTheDocument();

    expect(mockFetchXtdhTokens).toHaveBeenCalled();
  });
});
