import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import useFollowersList from "@/hooks/useFollowersList";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: jest.requireActual("@/components/react-query-wrapper/query-keys")
    .QueryKey,
}));

function setup(enabled = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(() => useFollowersList({ profileId: "owner", enabled }), {
      wrapper,
    }),
  };
}

beforeEach(() => jest.mocked(commonApiFetch).mockReset());

it("only confirms an empty list after a successful zero-count response", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    data: [],
    count: 0,
    page: 1,
    next: false,
  });
  const { result } = setup();
  expect(result.current.isFetching).toBe(true);
  expect(result.current.isEmpty).toBe(false);
  await waitFor(() => expect(result.current.isEmpty).toBe(true));
});

it("does not show an empty state when the list is disabled", () => {
  const { result } = setup(false);
  expect(result.current.isFetching).toBe(false);
  expect(result.current.isEmpty).toBe(false);
  expect(commonApiFetch).not.toHaveBeenCalled();
});

it("does not show an empty state when loading fails", async () => {
  jest.mocked(commonApiFetch).mockRejectedValue(new Error("Unavailable"));
  const { result, client } = setup();
  await waitFor(() =>
    expect(client.getQueryCache().getAll()[0]?.state.status).toBe("error")
  );
  expect(result.current.isEmpty).toBe(false);
});

it("does not show an empty state when followers exist", async () => {
  const follower = {
    identity: {
      id: "alice",
      handle: "alice",
      pfp: null,
      level: 1,
      primary_address: "0x123",
    },
    actions: [],
  };
  jest.mocked(commonApiFetch).mockResolvedValue({
    data: [follower],
    count: 1,
    page: 1,
    next: false,
  });
  const { result } = setup();
  await waitFor(() => expect(result.current.followers).toEqual([follower]));
  expect(result.current.isEmpty).toBe(false);
});

it("does not keep a cached empty state visible after a failed refresh", async () => {
  jest.mocked(commonApiFetch).mockResolvedValueOnce({
    data: [],
    count: 0,
    page: 1,
    next: false,
  });
  const { result, client } = setup();
  await waitFor(() => expect(result.current.isEmpty).toBe(true));
  jest.mocked(commonApiFetch).mockRejectedValue(new Error("Unavailable"));
  await act(async () => {
    await client.invalidateQueries();
  });
  await waitFor(() => expect(result.current.isEmpty).toBe(false));
});
