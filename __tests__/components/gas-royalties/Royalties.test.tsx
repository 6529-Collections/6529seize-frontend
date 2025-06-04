import { render, screen, waitFor } from "@testing-library/react";
import Royalties from "../../../components/gas-royalties/Royalties";
import { useRouter } from "next/router";
import { fetchUrl } from "../../../services/6529api";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));

jest.mock("../../../services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

// Mock the shared module with configurable return values
const mockState: any = {
  dateSelection: "",
  setDateSelection: jest.fn(),
  fromDate: undefined,
  toDate: undefined,
  isPrimary: false,
  setIsPrimary: jest.fn(),
  isCustomBlocks: false,
  setIsCustomBlocks: jest.fn(),
  selectedArtist: "",
  collectionFocus: "the-memes",
  setCollectionFocus: jest.fn(),
  fetching: false,
  setFetching: jest.fn(),
  getUrl: () => "api/url",
  getSharedProps: () => ({ fetching: false, results_count: 0 } as any),
  fromBlock: undefined,
  toBlock: undefined,
};

jest.mock("../../../components/gas-royalties/GasRoyalties", () => ({
  GasRoyaltiesCollectionFocus: { MEMES: "the-memes", MEMELAB: "meme-lab" },
  GasRoyaltiesHeader: () => <div data-testid="header" />,
  GasRoyaltiesTokenImage: ({ name }: any) => (
    <img data-testid="token-image" alt={name} />
  ),
  useSharedState: () => mockState,
}));

const router = { isReady: true, query: {}, push: jest.fn() } as any;
(useRouter as jest.Mock).mockReturnValue(router);

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockState, { royalties: [], fetching: false, collectionFocus: "the-memes" });
});

it("shows message when no royalties are returned", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([]);
  render(<Royalties />);
  await waitFor(() => {
    expect(screen.getByText(/No royalties found/i)).toBeInTheDocument();
  });
});

it("renders royalties table when data exists", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([
    {
      token_id: 1,
      name: "Meme1",
      artist: "Alice",
      volume: 1,
      proceeds: 2,
      artist_split: 0.5,
      artist_take: 1,
      thumbnail: "img.png",
    },
  ]);
  render(<Royalties />);
  await waitFor(() => screen.getByTestId("token-image"));
  expect(screen.getByAltText("Meme1")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
  expect(screen.getAllByText("1.00").length).toBeGreaterThan(0);
});
