import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

import MemeCardLayout from "@/app/the-memes/[id]/layout";
import MemeDistributionPage from "@/app/the-memes/[id]/distribution/page";
import { fetchAllPages, fetchUrl } from "@/services/6529api";

const UPCOMING_MINT_ID = "123";

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
  fetchAllPages: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://6529.io",
  },
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  getCanonicalNextMintNumber: () => 123,
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useParams: () => ({ id: "123" }),
}));

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({ setTitle: jest.fn() }),
}));

jest.mock("@/components/the-memes/MemeShared", () => ({
  getSharedAppServerSideProps: jest.fn(),
  MEME_FOCUS: { LIVE: "live" },
}));

jest.mock("@/components/the-memes/UpcomingMemePage", () => ({
  __esModule: true,
  default: ({ id }: { readonly id: string }) => (
    <div data-testid="upcoming-meme-page" data-id={id} />
  ),
}));

jest.mock("@/components/home/now-minting/NowMintingCountdown", () => ({
  __esModule: true,
  default: ({ nftId }: { readonly nftId: number }) => (
    <div data-testid="mint-countdown" data-nft-id={nftId} />
  ),
}));

jest.mock("@/components/searchModal/SearchModal", () => ({
  SearchWalletsDisplay: () => null,
  SearchModalDisplay: () => null,
}));

jest.mock("@/components/address/Address", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/scrollTo/ScrollToButton", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { readonly alt?: string }) => <img alt={alt ?? ""} />,
}));

const mockFetchUrl = fetchUrl as jest.Mock;
const mockFetchAllPages = fetchAllPages as jest.Mock;

async function renderDistributionRoute() {
  const page = await MemeDistributionPage({
    searchParams: Promise.resolve({}),
  });
  const routed = await MemeCardLayout({
    children: page,
    params: Promise.resolve({ id: UPCOMING_MINT_ID }),
  });
  render(routed);
}

describe("The Memes distribution route for ids that are not published yet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAllPages.mockResolvedValue([]);
  });

  it("shows the upcoming empty state for the confirmed next mint", async () => {
    mockFetchUrl.mockResolvedValue({ count: 0, data: [] });

    await renderDistributionRoute();

    expect(
      await screen.findByRole("heading", {
        name: /The Memes Card #123 Distribution/,
      })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/Distribution Plan will be made available soon/)
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("upcoming-meme-page")).toHaveAttribute(
      "data-id",
      UPCOMING_MINT_ID
    );
    expect(screen.getByTestId("mint-countdown")).toHaveAttribute(
      "data-nft-id",
      UPCOMING_MINT_ID
    );
  });

  it("falls back to the empty state when the API is unavailable", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 503"));
    mockFetchAllPages.mockRejectedValue(new Error("HTTP error! status: 503"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await renderDistributionRoute();

    expect(
      await screen.findByRole("heading", {
        name: /The Memes Card #123 Distribution/,
      })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/Distribution Plan will be made available soon/)
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("upcoming-meme-page")).toBeInTheDocument();
  });
});
