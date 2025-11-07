import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

const mockFetchXtdhTokens = jest.fn();

jest.mock("@/services/api/xtdh", () => ({
  fetchXtdhTokens: (...args: unknown[]) => mockFetchXtdhTokens(...args),
  fetchXtdhTokenContributors: jest.fn().mockResolvedValue([]),
}));

describe("UserPageXtdhReceived", () => {
  beforeEach(() => {
    mockFetchXtdhTokens.mockResolvedValue({
      tokens: [],
      page: 1,
      hasNextPage: false,
    });
  });

  it("passes the profile identifier to the API", async () => {
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <UserPageXtdhReceived profileId="simo" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockFetchXtdhTokens).toHaveBeenCalled();
    });

    expect(mockFetchXtdhTokens).toHaveBeenCalledWith(
      expect.objectContaining({ grantee: "simo" }),
    );
  });

  it("renders a placeholder when the profile is unknown", () => {
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <UserPageXtdhReceived profileId={null} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(/Connect a profile to view NFTs/i),
    ).toBeInTheDocument();
  });
});
