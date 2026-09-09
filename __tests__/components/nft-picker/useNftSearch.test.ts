import { act, renderHook } from "@testing-library/react";
import { useNftSearch } from "@/components/nft-picker/hooks/useNftSearch";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useContractOverviewQuery: jest.fn(),
  primeContractCache: jest.fn(),
}));

const address = "0x000000000000000000000000000000000000dead";
const lookup = jest.mocked(useContractOverviewQuery);
const refetch = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  lookup.mockReturnValue({
    data: null,
    isFetching: false,
    isError: false,
    isSuccess: false,
    refetch,
  } as unknown as ReturnType<typeof useContractOverviewQuery>);
});

afterEach(() => jest.useRealTimers());

function renderSearch() {
  return renderHook(() => useNftSearch({ chain: "ethereum", debounceMs: 250 }));
}

it.each(["memes", "example.eth", "0x123", "https://example.com/collection"])(
  "does not look up non-address input %s",
  (query) => {
    const { result } = renderSearch();
    act(() => result.current.setQuery(query));
    act(() => jest.advanceTimersByTime(250));
    expect(lookup).toHaveBeenLastCalledWith({
      address: undefined,
      chain: "ethereum",
      enabled: false,
    });
    expect(result.current.isInvalidAddress).toBe(true);
    expect(result.current.isLoading).toBe(false);
  }
);

it("trims and debounces addresses and immediately hides stale results on edit", () => {
  lookup.mockImplementation(
    ({ address: input }) =>
      ({
        data: input
          ? { address: input, name: "Collection", tokenType: "ERC721" }
          : null,
        isFetching: false,
        isSuccess: Boolean(input),
        isError: false,
        refetch,
      }) as unknown as ReturnType<typeof useContractOverviewQuery>
  );
  const { result } = renderSearch();
  act(() => result.current.setQuery("  " + address + "  "));
  expect(result.current.isLoading).toBe(true);
  expect(result.current.suggestionList).toEqual([]);
  act(() => jest.advanceTimersByTime(250));
  expect(lookup).toHaveBeenLastCalledWith({
    address,
    chain: "ethereum",
    enabled: true,
  });
  expect(result.current.suggestionList).toHaveLength(1);
  act(() => result.current.setQuery("memes"));
  expect(result.current.suggestionList).toEqual([]);
  expect(result.current.isLoading).toBe(false);
});

it("distinguishes not-found results from request errors and exposes retry", () => {
  const { result, rerender } = renderSearch();
  act(() => result.current.setQuery(address));
  act(() => jest.advanceTimersByTime(250));
  lookup.mockReturnValue({
    data: null,
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch,
  } as unknown as ReturnType<typeof useContractOverviewQuery>);
  rerender();
  expect(result.current.isNotFound).toBe(true);
  expect(result.current.isError).toBe(false);
  lookup.mockReturnValue({
    data: null,
    isFetching: false,
    isSuccess: false,
    isError: true,
    refetch,
  } as unknown as ReturnType<typeof useContractOverviewQuery>);
  rerender();
  expect(result.current.isNotFound).toBe(false);
  expect(result.current.isError).toBe(true);
  act(() => {
    void result.current.retry();
  });
  expect(refetch).toHaveBeenCalledTimes(1);
});

it.each([0, 250])(
  "hides the old contract during a valid-to-valid edit with %i ms debounce",
  (debounceMs) => {
    const nextAddress = "0x000000000000000000000000000000000000beef";
    // Even if the query layer retains old data while disabled, it must be hidden.
    lookup.mockImplementation(
      ({ address: input }) =>
        ({
          data: {
            address: input ?? address,
            name: "Collection",
            tokenType: "ERC721",
          },
          isFetching: false,
          isSuccess: true,
          isError: false,
          refetch,
        }) as unknown as ReturnType<typeof useContractOverviewQuery>
    );
    const { result } = renderHook(() =>
      useNftSearch({ chain: "ethereum", debounceMs })
    );
    act(() => result.current.setQuery(address));
    act(() => jest.advanceTimersByTime(debounceMs));
    expect(result.current.suggestionList[0]?.address).toBe(address);

    act(() => result.current.setQuery(nextAddress));
    expect(result.current.suggestionList).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(lookup).toHaveBeenLastCalledWith({
      address: undefined,
      chain: "ethereum",
      enabled: false,
    });

    act(() => jest.advanceTimersByTime(debounceMs));
    expect(result.current.suggestionList[0]?.address).toBe(nextAddress);
    expect(result.current.isLoading).toBe(false);
  }
);
