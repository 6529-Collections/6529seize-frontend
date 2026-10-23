import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import useFollowingList from "@/hooks/useFollowingList";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { createWaveQueryHandlers } from "@/components/react-query-wrapper/ReactQueryWrapper.waveHandlers";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: jest.requireActual("@/components/react-query-wrapper/query-keys")
    .QueryKey,
}));

const row = (id: string) => ({
  target: { id, handle: id, pfp: null, level: 1, primary_address: "0x123" },
  actions: [],
});
const page = (ids: string[], count: number, number = 1, next = false) => ({
  data: ids.map(row),
  count,
  page: number,
  next,
});

function setup(id = "owner-a", enabled = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(
      ({ identityId, isOpen }) => useFollowingList(identityId, isOpen),
      {
        initialProps: { identityId: id, isOpen: enabled },
        wrapper,
      }
    ),
  };
}

beforeEach(() => jest.mocked(commonApiFetch).mockReset());

it("uses API total, requests consecutive pages and deduplicates overlapping rows", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(page(["a", "b"], 101, 1, true))
    .mockResolvedValueOnce(page(["b", "c"], 101, 2));
  const { result } = setup();
  await waitFor(() => expect(result.current.count).toBe(101));
  act(() => result.current.onBottomIntersection(true));
  await waitFor(() =>
    expect(result.current.following.map((r) => r.identity.id)).toEqual([
      "a",
      "b",
      "c",
    ])
  );
  expect(
    jest.mocked(commonApiFetch).mock.calls.map(([args]) => args.params)
  ).toEqual([
    { page: "1", page_size: "100" },
    { page: "2", page_size: "100" },
  ]);
  act(() => result.current.onBottomIntersection(true));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});

it("does not hide initial errors as a zero count and can retry", async () => {
  jest
    .mocked(commonApiFetch)
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce(page([], 0));
  const { result } = setup();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.count).toBeUndefined();
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.count).toBe(0));
});

it("does not start competing page requests for repeated intersection events", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(page(["a"], 2, 1, true))
    .mockImplementationOnce(() => new Promise(() => {}));
  const { result } = setup();
  await waitFor(() => expect(result.current.count).toBe(2));
  act(() => {
    result.current.onBottomIntersection(true);
    result.current.onBottomIntersection(true);
  });
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});

it("reports refresh failures while retaining previously loaded rows", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(page(["a"], 1))
    .mockRejectedValueOnce(new Error("Unavailable"));
  const { result } = setup();
  await waitFor(() => expect(result.current.count).toBe(1));
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.count).toBeUndefined();
  expect(result.current.following[0]?.identity.id).toBe("a");
});

it("retains loaded rows after a later-page failure and retries that page without automatic retry loops", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(page(["a"], 2, 1, true))
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce(page(["b"], 2, 2));
  const { result } = setup();
  await waitFor(() => expect(result.current.count).toBe(2));
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true));
  expect(result.current.following.map((r) => r.identity.id)).toEqual(["a"]);
  act(() => result.current.onBottomIntersection(true));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() =>
    expect(result.current.following.map((r) => r.identity.id)).toEqual([
      "a",
      "b",
    ])
  );
});

it("refetches loaded pages in order after follow/unfollow, filling shifted page boundaries", async () => {
  let ids = Array.from({ length: 101 }, (_, index) => `artist-${index}`);
  jest.mocked(commonApiFetch).mockImplementation(async ({ params }) => {
    const number = Number((params as Record<string, string>)["page"]);
    const end = number * 100;
    return page(
      ids.slice(end - 100, end),
      ids.length,
      number,
      end < ids.length
    );
  });
  const { result, client } = setup();
  await waitFor(() => expect(result.current.count).toBe(101));
  await act(async () => {
    await result.current.fetchNextPage();
  });
  ids = ids.slice(1);
  act(() => createWaveQueryHandlers(client).onIdentityFollowChange());
  await waitFor(() => expect(result.current.count).toBe(100));
  await waitFor(() => expect(result.current.isFetching).toBe(false));
  expect(result.current.following.map((r) => r.identity.id)).toEqual(ids);
  ids = ["new-artist", ...ids];
  act(() => createWaveQueryHandlers(client).onIdentityFollowChange());
  await waitFor(() => expect(result.current.count).toBe(101));
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() =>
    expect(result.current.following.map((r) => r.identity.id)).toEqual(ids)
  );
});

it("does not expose another identity's cached rows during an account change", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(page(["private-a"], 1))
    .mockImplementationOnce(() => new Promise(() => {}));
  const { result, rerender, client, unmount } = setup();
  await waitFor(() => expect(result.current.count).toBe(1));
  rerender({ identityId: "owner-b", isOpen: true });
  expect(result.current.following).toEqual([]);
  expect(result.current.count).toBeUndefined();
  await waitFor(() =>
    expect(
      client.getQueryData([QueryKey.IDENTITY_FOLLOWING, "owner-a", "list"])
    ).toBeUndefined()
  );
  unmount();
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(0));
});

it("cancels an old account request and ignores its late response", async () => {
  let resolveOld!: (value: unknown) => void;
  jest
    .mocked(commonApiFetch)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        })
    )
    .mockResolvedValueOnce(page(["private-b"], 1));
  const { result, rerender } = setup();
  const oldSignal = jest.mocked(commonApiFetch).mock.calls[0]?.[0].signal;
  rerender({ identityId: "owner-b", isOpen: true });
  expect(oldSignal?.aborted).toBe(true);
  await waitFor(() =>
    expect(result.current.following[0]?.identity.id).toBe("private-b")
  );
  await act(async () => {
    resolveOld(page(["private-a"], 1));
  });
  expect(result.current.following[0]?.identity.id).toBe("private-b");
});

it("does not load a closed list, including on intersection callbacks", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue(page(["a"], 2, 1, true));
  const { result, rerender } = setup("owner-a", false);
  act(() => result.current.onBottomIntersection(true));
  expect(commonApiFetch).not.toHaveBeenCalled();
  rerender({ identityId: "owner-a", isOpen: true });
  await waitFor(() => expect(result.current.count).toBe(2));
  rerender({ identityId: "owner-a", isOpen: false });
  act(() => result.current.onBottomIntersection(true));
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
});
