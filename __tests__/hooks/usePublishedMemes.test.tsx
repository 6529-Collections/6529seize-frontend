import usePublishedMemes from "@/hooks/usePublishedMemes";
import type { NFTLite } from "@/entities/INFT";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMemes = jest.mocked(commonApiFetch);
let queryClient: QueryClient;

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePublishedMemes", () => {
  beforeEach(() => {
    fetchMemes.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("maps the published catalogue to a deduplicated id set", async () => {
    const response = Promise.withResolvers<{ data: NFTLite[] }>();
    fetchMemes.mockReturnValue(response.promise);

    const { result } = renderHook(() => usePublishedMemes(), { wrapper });
    expect(result.current.status).toBe("loading");
    expect(result.current.publishedMemeIds.size).toBe(0);

    await act(async () =>
      response.resolve({
        data: [
          { id: 551 } as NFTLite,
          { id: 551 } as NFTLite,
          { id: 552 } as NFTLite,
        ],
      })
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect([...result.current.publishedMemeIds]).toEqual([551, 552]);
  });

  it("returns an empty set when the catalogue request fails", async () => {
    fetchMemes.mockRejectedValue(new Error("catalogue unavailable"));

    const { result } = renderHook(() => usePublishedMemes(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.publishedMemeIds.size).toBe(0);
  });
});
