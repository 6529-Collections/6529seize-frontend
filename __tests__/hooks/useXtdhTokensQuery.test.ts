import { renderHook } from "@testing-library/react";
import { useXtdhTokensQuery } from "@/hooks/useXtdhTokensQuery";

const mockUseInfiniteQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: Symbol("keepPreviousData"),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetch =
  require("@/services/api/common-api").commonApiFetch as jest.Mock;

const defaultQueryResult = {
  data: undefined,
  error: undefined,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetching: false,
  isInitialLoading: false,
  isLoading: false,
  isSuccess: true,
  status: "success",
};

describe("useXtdhTokensQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteQuery.mockReturnValue(defaultQueryResult);
  });

  it("passes uppercase ASC sort direction", async () => {
    let capturedConfig: any;
    mockUseInfiniteQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() =>
      useXtdhTokensQuery({
        identity: "0xabc",
        contract: "0x123",
        order: "ASC",
      })
    );

    expect(capturedConfig).toBeTruthy();
    await capturedConfig.queryFn({ pageParam: 1 });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          order: "ASC",
        }),
      })
    );
  });

  it("passes uppercase DESC sort direction", async () => {
    let capturedConfig: any;
    mockUseInfiniteQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() =>
      useXtdhTokensQuery({
        identity: "0xabc",
        contract: "0x123",
        order: "DESC",
      })
    );

    expect(capturedConfig).toBeTruthy();
    await capturedConfig.queryFn({ pageParam: 1 });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          order: "DESC",
        }),
      })
    );
  });
});
