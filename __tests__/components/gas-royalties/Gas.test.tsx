import { act, render, screen, waitFor } from "@testing-library/react";
import GasComponent from "@/components/gas-royalties/Gas";
import type { Gas } from "@/entities/IGas";
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

jest.mock("@/components/gas-royalties/GasRoyalties", () => ({
  GasRoyaltiesCollectionFocus: { MEMES: "the-memes", MEMELAB: "meme-lab" },
  GasRoyaltiesHeader: () => <div data-testid="header" />,
  GasRoyaltiesTokenImage: ({ name }: any) => (
    <img data-testid="token-image" alt={name} />
  ),
  useSharedState: () => mockState,
}));

const router = { isReady: true, query: {}, push: jest.fn() } as any;
(useRouter as jest.Mock).mockReturnValue(router);
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
(usePathname as jest.Mock).mockReturnValue("/meme-gas");

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockState, {
    gas: [],
    dateSelection: "",
    fetching: false,
    collectionFocus: "the-memes",
  });
});

const gasTree = () => (
  <TitleProvider>
    <GasComponent />
  </TitleProvider>
);

const renderGas = () => render(gasTree());

const gasRow = (overrides: Partial<Gas>): Gas => ({
  token_id: 1,
  contract: "0x0",
  name: "Meme1",
  artist: "Alice",
  gas: 1,
  thumbnail: "img.png",
  ...overrides,
});

const mockPendingRequests = () => {
  const requests: DeferredPromise<Gas[]>[] = [];
  (fetchUrl as jest.Mock).mockImplementation(() => {
    const request = createDeferredPromise<Gas[]>();
    requests.push(request);
    return request.promise;
  });
  return requests;
};

const requestSignals = () =>
  (fetchUrl as jest.Mock).mock.calls.map(
    ([, init]) => (init as RequestInit).signal
  );

test("shows message when no gas info is returned", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([]);
  renderGas();
  await waitFor(() => {
    expect(screen.getByText(/No gas info found/i)).toBeInTheDocument();
  });
});

test("renders gas table when data exists", async () => {
  (fetchUrl as jest.Mock).mockResolvedValue([
    {
      token_id: 1,
      name: "Meme1",
      artist: "Alice",
      gas: 1,
      thumbnail: "img.png",
    },
  ]);
  renderGas();
  await waitFor(() => screen.getByTestId("token-image"));
  expect(screen.getByAltText("Meme1")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
  expect(screen.getAllByText("1.00").length).toBeGreaterThan(0);
});

describe("stale responses", () => {
  test("ignores older responses that resolve after a newer request", async () => {
    const requests = mockPendingRequests();
    const view = renderGas();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    const mounted = requests.length;

    mockState.dateSelection = "last-month";
    view.rerender(gasTree());
    await waitFor(() => expect(requests).toHaveLength(mounted + 1));

    await act(async () => {
      requests[mounted]?.resolve([gasRow({ artist: "Bob" })]);
    });
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    const fetchingDoneCalls = () =>
      (mockState.setFetching as jest.Mock).mock.calls.filter(
        ([value]) => value === false
      ).length;
    const doneBeforeStale = fetchingDoneCalls();

    await act(async () => {
      requests[mounted - 1]?.resolve([gasRow({ artist: "Alice" })]);
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

  test("does not report an error for a superseded request that fails", async () => {
    const requests = mockPendingRequests();
    const view = renderGas();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    const mounted = requests.length;

    mockState.dateSelection = "last-month";
    view.rerender(gasTree());
    await waitFor(() => expect(requests).toHaveLength(mounted + 1));
    await act(async () => {
      requests[mounted]?.resolve([gasRow({ artist: "Bob" })]);
    });
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    await act(async () => {
      requests[mounted - 1]?.reject(new DOMException("Aborted", "AbortError"));
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("aborts the request in flight when unmounted", async () => {
    const requests = mockPendingRequests();
    const view = renderGas();
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    expect(requestSignals().at(-1)?.aborted).toBe(false);

    view.unmount();
    expect(requestSignals().every((signal) => signal?.aborted)).toBe(true);
  });
});
