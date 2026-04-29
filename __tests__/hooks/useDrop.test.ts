import { renderHook, act } from "@testing-library/react";
import { useDrop } from "@/hooks/useDrop";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchDropByIdBatched } from "@/services/api/drop-api";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/drop-api", () => {
  const actual = jest.requireActual("@/services/api/drop-api");
  return {
    ...actual,
    fetchDropByIdBatched: jest.fn(),
  };
});

const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const fetchDropByIdBatchedMock = fetchDropByIdBatched as jest.Mock;

describe("useDrop hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefetches drop", async () => {
    const prefetchQuery = jest.fn();
    useQueryClientMock.mockReturnValue({ prefetchQuery });
    useQueryMock.mockReturnValue({
      data: { id: "d" },
      isFetching: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useDrop({ dropId: "d1" }));
    await act(async () => {
      result.current.prefetchDrop();
    });
    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP, { drop_id: "d1" }],
      queryFn: expect.any(Function),
      staleTime: 60000,
    });
    fetchDropByIdBatchedMock.mockResolvedValue({ id: "d1" });
    await prefetchQuery.mock.calls[0][0].queryFn();
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("d1");
  });

  it("uses initial data when provided", () => {
    useQueryClientMock.mockReturnValue({ prefetchQuery: jest.fn() });
    const refetch = jest.fn();
    useQueryMock.mockReturnValue({
      data: { id: "init" },
      isFetching: false,
      refetch,
    });
    const { result } = renderHook(() =>
      useDrop({ dropId: "d1", initialDrop: { id: "init" } as any })
    );
    expect(result.current.drop).toEqual({ id: "init" });
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP, { drop_id: "d1" }],
      queryFn: expect.any(Function),
      initialData: { id: "init" },
      placeholderData: keepPreviousData,
      enabled: true,
      staleTime: 60000,
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.refetch).toBe(refetch);
  });
});
