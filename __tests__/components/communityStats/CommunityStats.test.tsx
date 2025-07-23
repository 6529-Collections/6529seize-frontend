import { render, screen, waitFor } from "@testing-library/react";
import CommunityStats from "@/components/communityStats/CommunityStats";
import { TitleProvider } from "@/contexts/TitleContext";

const fetchUrlMock = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrlMock(...args),
}));

jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="chart" />,
}));

function setup() {
  process.env.API_ENDPOINT = "https://api.test";
  const latest = {
    date: new Date("2024-01-02"),
    block: 0,
    created_tdh: 0,
    destroyed_tdh: 0,
    net_tdh: 0,
    created_boosted_tdh: 0,
    destroyed_boosted_tdh: 0,
    net_boosted_tdh: 50000000,
    created_tdh__raw: 0,
    destroyed_tdh__raw: 0,
    net_tdh__raw: 0,
    memes_balance: 0,
    gradients_balance: 0,
    total_boosted_tdh: 600000000,
    total_tdh: 0,
    total_tdh__raw: 0,
    gradients_boosted_tdh: 0,
    gradients_tdh: 0,
    gradients_tdh__raw: 0,
    memes_boosted_tdh: 0,
    memes_tdh: 0,
    memes_tdh__raw: 0,
    total_consolidated_wallets: 0,
    total_wallets: 0,
  } as any;
  const earlier = {
    ...latest,
    date: new Date("2024-01-01"),
    total_boosted_tdh: 550000000,
  };
  fetchUrlMock.mockResolvedValue({ count: 2, data: [latest, earlier] });
  return { latest, earlier };
}

describe("CommunityStats", () => {
  beforeEach(() => {
    fetchUrlMock.mockClear();
    setup();
  });

  it("fetches history and displays estimated checkpoints", async () => {
    render(
      <TitleProvider>
        <CommunityStats />
      </TitleProvider>
    );

    await waitFor(() => expect(fetchUrlMock).toHaveBeenCalled());
    expect(fetchUrlMock).toHaveBeenCalledWith(
      `https://api.test/api/tdh_global_history?page_size=10&page=1`
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Network Stats/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Network TDH")).toBeInTheDocument();
    expect(screen.getByText("600,000,000")).toBeInTheDocument();
    expect(screen.getByText("Estimated days until 750M")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
