import { render } from "@testing-library/react";
import { SortDirection } from "@/entities/ISort";
import UserPageXtdhGrantedList from "@/components/user/xtdh/UserPageXtdhGrantedList";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockUseQuery = jest.fn();
const mockUseSearchParams = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: Symbol("keepPreviousData"),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/profiles/test", // stable path for tests
  useSearchParams: () => mockUseSearchParams(),
}));

const commonApiFetch =
  require("@/services/api/common-api").commonApiFetch as jest.Mock;

type MockedApiResponse = Pick<ApiTdhGrantsPage, "data" | "count" | "page" | "next">;

const baseData: MockedApiResponse = {
  data: [],
  count: 0,
  page: 1,
  next: false,
};

const baseQueryResult = {
  data: baseData,
  isLoading: false,
  isError: false,
  error: undefined,
  refetch: jest.fn(),
  isFetching: false,
};

describe("UserPageXtdhGrantedList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue(baseQueryResult);
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    commonApiFetch.mockResolvedValue(baseData);
  });

  it("requests TDH grants using an uppercase sort direction by default", async () => {
    render(<UserPageXtdhGrantedList grantor="0xabc" />);

    const queryArgs = mockUseQuery.mock.calls[0]?.[0];
    expect(queryArgs).toBeTruthy();

    await queryArgs.queryFn();

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          sort_direction: SortDirection.DESC,
        }),
      })
    );
  });

  it("normalizes lowercase query params before hitting the API", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("dir=asc"));

    render(<UserPageXtdhGrantedList grantor="0xabc" />);

    const queryArgs = mockUseQuery.mock.calls[0]?.[0];
    expect(queryArgs).toBeTruthy();

    await queryArgs.queryFn();

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          sort_direction: SortDirection.ASC,
        }),
      })
    );
  });
});
