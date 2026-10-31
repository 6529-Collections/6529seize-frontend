import { act, render, screen, waitFor } from "@testing-library/react";
import Royalties from "@/components/gas-royalties/Royalties";
import type { Royalty } from "@/entities/IRoyalty";
import {
  createDeferredPromise,
  type DeferredPromise,
} from "@/__tests__/utils/deferredPromise";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { fetchUrl } from "@/services/6529api";
import { TitleProvider } from "@/contexts/TitleContext";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/services/6529api", () => ({
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
  getSharedProps: () => ({ fetching: false, results_count: 0 }) as any,
  fromBlock: undefined,
  toBlock: undefined,
};

jest.mock("@/components/gas-royalties/GasRoyalties", () => ({
  GasRoyaltiesCollectionFocus: { MEMES: "the-memes", MEMELAB: "meme-lab" },
  GasRoyaltiesHeader: () => <div data-testid="header" />,
  GasRoyaltiesTokenImage: ({ name }: any) => (
    <img data-testid="token-image" alt={name} />
  ),
  useSharedState: () => mockState,
}));

const router = { push: jest.fn() } as any;
(useRouter as jest.Mock).mockReturnValue(router);
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
(usePathname as jest.Mock).mockReturnValue("/meme-accounting");

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockState, {
    royalties: [],
    dateSelection: "",
    fetching: false,
    collectionFocus: "the-memes",
    isPrimary: false,
    isCustomBlocks: false,
  });
});

const royaltiesTree = () => (
  <TitleProvider>
    <Royalties />
  </TitleProvider>
);

const renderRoyalties = () => render(royaltiesTree());

const royaltyRow = (overrides: Partial<Royalty>): Royalty => ({
  token_id: 1,
  contract: "0x0",
  name: "Meme1",
  artist: "Alice",
  volume: 1,
  proceeds: 2,
  artist_split: 0.5,
  artist_take: 1,
  thumbnail: "img.png",
  ...overrides,
});

const mockPendingRequests = () => {
  const requests: DeferredPromise<Royalty[]>[] = [];
  (fetchUrl as jest.Mock).mockImplementation(() => {
    const request = createDeferredPromise<Royalty[]>();
    requests.push(request);
    return request.promise;
  });
  return requests;
};

const requestSignals = () =>
  (fetchUrl as jest.Mock).mock.calls.map(
    ([, init]) => (init as RequestInit).signal
  );

it("shows message when no royalties are returned", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([]);
  renderRoyalties();
  await waitFor(() => {
    expect(screen.getByText(/No royalties found/i)).toBeInTheDocument();
  });
});

it("shows an error and clears fetching when royalties fail to load", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  (fetchUrl as jest.Mock).mockRejectedValue(new Error("request failed"));

  renderRoyalties();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /failed to load royalties data/i
  );
  expect(mockState.setFetching).toHaveBeenLastCalledWith(false);
  expect(screen.queryByText(/No royalties found/i)).not.toBeInTheDocument();
  consoleError.mockRestore();
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
  renderRoyalties();
  await waitFor(() => screen.getByTestId("token-image"));
  expect(screen.getByAltText("Meme1")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
  expect(screen.getAllByText("1.00").length).toBeGreaterThan(0);
});

it("guards effective royalty percentages when volume is zero", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([
    {
      token_id: 1,
      name: "Meme1",
      artist: "Alice",
      volume: 0,
      proceeds: 2,
      artist_split: 0.5,
      artist_take: 0,
      thumbnail: "img.png",
    },
  ]);

  renderRoyalties();
  await waitFor(() => screen.getByTestId("token-image"));

  expect(document.body).not.toHaveTextContent(/Infinity|NaN/);
});

it("guards the total artist percentage when proceeds are zero", async () => {
  mockState.collectionFocus = "meme-lab";
  (fetchUrl as jest.Mock).mockResolvedValue([
    {
      token_id: 1,
      name: "Meme1",
      artist: "Alice",
      volume: 0,
      proceeds: 0,
      artist_split: 0.5,
      artist_take: 1,
      thumbnail: "img.png",
    },
  ]);

  renderRoyalties();
  await waitFor(() => screen.getByTestId("token-image"));

  expect(document.body).not.toHaveTextContent(/Infinity|NaN/);
});

describe("stale responses", () => {
  it("ignores older responses that resolve after a newer request", async () => {
    const requests = mockPendingRequests();
    const view = renderRoyalties();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    const mounted = requests.length;

    mockState.dateSelection = "last-month";
    view.rerender(royaltiesTree());
    await waitFor(() => expect(requests).toHaveLength(mounted + 1));

    await act(async () => {
      requests[mounted]?.resolve([royaltyRow({ artist: "Bob" })]);
    });
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    const fetchingDoneCalls = () =>
      (mockState.setFetching as jest.Mock).mock.calls.filter(
        ([value]) => value === false
      ).length;
    const doneBeforeStale = fetchingDoneCalls();

    await act(async () => {
      requests[mounted - 1]?.resolve([royaltyRow({ artist: "Alice" })]);
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(fetchingDoneCalls()).toBe(doneBeforeStale);
    expect(requestSignals().at(-1)?.aborted).toBe(false);
    expect(
      requestSignals()
        .slice(0, -1)
        .every((signal) => signal?.aborted)
    ).toBe(true);
  });

  it("does not report an error for a superseded request that fails", async () => {
    const requests = mockPendingRequests();
    const view = renderRoyalties();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    const mounted = requests.length;

    mockState.dateSelection = "last-month";
    view.rerender(royaltiesTree());
    await waitFor(() => expect(requests).toHaveLength(mounted + 1));
    await act(async () => {
      requests[mounted]?.resolve([royaltyRow({ artist: "Bob" })]);
    });
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    await act(async () => {
      requests[mounted - 1]?.reject(new DOMException("Aborted", "AbortError"));
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aborts the request in flight when unmounted", async () => {
    const requests = mockPendingRequests();
    const view = renderRoyalties();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    expect(requestSignals().at(-1)?.aborted).toBe(false);

    view.unmount();
    expect(requestSignals().every((signal) => signal?.aborted)).toBe(true);
  });
});
