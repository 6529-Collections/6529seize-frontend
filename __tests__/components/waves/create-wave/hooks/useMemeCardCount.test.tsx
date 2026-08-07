import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMemeCardCount } from "@/components/waves/create-wave/hooks/useMemeCardCount";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockedCommonApiFetch = commonApiFetch as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
};

describe("useMemeCardCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the meme card count from the extended data endpoint", async () => {
    mockedCommonApiFetch.mockResolvedValue({ count: 137 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemeCardCount({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(137);
    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "memes_extended_data",
      params: { page_size: "1" },
    });
  });

  it("does not fetch while disabled", () => {
    mockedCommonApiFetch.mockResolvedValue({ count: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemeCardCount({ enabled: false }), {
      wrapper,
    });

    expect(mockedCommonApiFetch).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("fetches once enabled flips to true", async () => {
    mockedCommonApiFetch.mockResolvedValue({ count: 42 });
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useMemeCardCount({ enabled }),
      { wrapper, initialProps: { enabled: false } }
    );

    expect(mockedCommonApiFetch).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(42);
  });

  it("surfaces fetch errors to the caller", async () => {
    mockedCommonApiFetch.mockRejectedValue(new Error("memes api down"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemeCardCount({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("memes api down");
  });

  it("caches under a meme-card-set-count scoped query key", async () => {
    mockedCommonApiFetch.mockResolvedValue({ count: 7 });
    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useMemeCardCount({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      queryClient.getQueryData([
        QueryKey.MEMES_LATEST,
        { scope: "meme-card-set-count" },
      ])
    ).toBe(7);
  });
});
