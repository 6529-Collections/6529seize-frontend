import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";

jest.mock("@/config/env", () => ({
  publicEnv: { API_ENDPOINT: "https://api.example.com" },
}));

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn();
let queryClient: QueryClient;
const address = "0x0000000000000000000000000000000000001234";

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});
afterEach(() => {
  queryClient.clear();
  globalThis.fetch = originalFetch;
});

it("uses the BE contract metadata shape when the primary route fails", async () => {
  fetchMock
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address,
        _checksum: address,
        name: "Collection",
        tokenType: "ERC721",
        openSeaMetadata: {
          floorPrice: 1.5,
          imageUrl: "https://example.com/art.png",
        },
      }),
    });
  const { result } = renderHook(() => useContractOverviewQuery({ address }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toMatchObject({
    address,
    name: "Collection",
    floorPriceEth: 1.5,
  });
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    `/api/alchemy/contract?address=${address}&chain=ethereum`,
    `https://api.example.com/alchemy-proxy/contract?address=${address}&chain=ethereum`,
  ]);
});

it("keeps missing metadata as null without falling back or inventing a collection", async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => null });
  const { result } = renderHook(
    () =>
      useContractOverviewQuery({
        address: "0x0000000000000000000000000000000000001235",
      }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("surfaces failure when neither route can load metadata", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503 });
  const { result } = renderHook(
    () =>
      useContractOverviewQuery({
        address: "0x0000000000000000000000000000000000001236",
      }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
