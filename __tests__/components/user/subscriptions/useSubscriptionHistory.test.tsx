import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createTestQueryClient } from "@/__tests__/utils/reactQuery";
import { useSubscriptionHistory } from "@/components/user/subscriptions/useSubscriptionHistory";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");
const fetch = jest.mocked(commonApiFetch);
const pageResult = (page = 1, count = 30) => ({
  page,
  count,
  next: page < 3,
  data: [],
});
const endpoint = (kind: string, page = 1, profile = "profile-a") =>
  `subscriptions/consolidation/${kind}/${profile}?page=${page}&page_size=10`;

function setup(profileKey: string | undefined = "profile-a") {
  const client = createTestQueryClient();
  return renderHook(
    ({ profile }: { profile: string | undefined }) =>
      useSubscriptionHistory(profile),
    {
      initialProps: { profile: profileKey },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
}

beforeEach(() => {
  fetch.mockReset();
  fetch.mockImplementation(async ({ endpoint: url }) =>
    pageResult(
      Number(new URL(url, "https://example.com").searchParams.get("page"))
    )
  );
});

it("loads only Redeemed initially, then caches each selected tab and its independent pages", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenLastCalledWith({
    endpoint: endpoint("redeemed"),
    signal: expect.any(AbortSignal),
  });
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenLastCalledWith({
    endpoint: endpoint("logs"),
    signal: expect.any(AbortSignal),
  });
  act(() => result.current.setPage("logs", 2));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  expect(result.current.logs.page).toBe(2);
  expect(fetch).toHaveBeenCalledTimes(3);
  act(() => result.current.setSelectedIndex(0));
  expect(result.current.redeemed.page).toBe(1);
  act(() => result.current.setSelectedIndex(1));
  expect(result.current.logs.page).toBe(2);
  expect(result.current.logsLoading).toBe(false);
  act(() => result.current.setPage("logs", 1));
  expect(result.current.logs.page).toBe(1);
  expect(result.current.logsLoading).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(3);
  act(() => result.current.setSelectedIndex(2));
  await waitFor(() => expect(result.current.topupsLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(fetch).toHaveBeenLastCalledWith({
    endpoint: endpoint("top-up"),
    signal: expect.any(AbortSignal),
  });
});

it("refreshes the selected page and invalidates cached inactive pages without fetching unopened tabs", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  act(() => result.current.setPage("logs", 2));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  fetch.mockClear();
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  expect(result.current.logs.page).toBe(2);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenLastCalledWith({
    endpoint: endpoint("logs", 2),
    signal: expect.any(AbortSignal),
  });
  act(() => result.current.setSelectedIndex(0));
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(2);
  act(() => result.current.setSelectedIndex(1));
  expect(result.current.logs.page).toBe(2);
  expect(fetch).toHaveBeenCalledTimes(2);
  act(() => result.current.setPage("logs", 1));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch).not.toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: endpoint("top-up") })
  );
});

it("recovers a failed selected history through refresh", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  fetch.mockRejectedValueOnce(new Error("History unavailable"));
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.logsLoading).toBe(false);
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.isError).toBe(false));
  expect(result.current.logs.count).toBe(30);
  expect(fetch).toHaveBeenCalledTimes(3);
});

it("does not fetch without a profile and resets the selection and pages for another profile", async () => {
  const { result, rerender } = setup("");
  expect(fetch).not.toHaveBeenCalled();
  rerender({ profile: "profile-a" });
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  act(() => result.current.setPage("logs", 2));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  fetch.mockClear();
  rerender({ profile: "profile-b" });
  expect(result.current.selectedIndex).toBe(0);
  expect(result.current.logs.data).toEqual([]);
  expect(result.current.logs.page).toBe(1);
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenLastCalledWith({
    endpoint: endpoint("redeemed", 1, "profile-b"),
    signal: expect.any(AbortSignal),
  });
});

it("does not let a late page response overwrite the selected page", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  let resolveOld!: (value: ReturnType<typeof pageResult>) => void;
  fetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      })
  );
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  act(() => result.current.setPage("logs", 2));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  await act(async () => resolveOld(pageResult(1, 99)));
  expect(result.current.logs.page).toBe(2);
  expect(result.current.logs.count).toBe(30);
});

it("cancels a hidden in-flight history before invalidation so reopening gets fresh data", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.redeemedLoading).toBe(false));
  let resolveOld!: (value: ReturnType<typeof pageResult>) => void;
  fetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      })
  );
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  const oldSignal = fetch.mock.calls[1]?.[0].signal;
  act(() => result.current.setSelectedIndex(0));
  await act(() => result.current.refresh());
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => resolveOld(pageResult(1, 99)));
  act(() => result.current.setSelectedIndex(1));
  await waitFor(() => expect(result.current.logsLoading).toBe(false));
  expect(result.current.logs.count).toBe(30);
  expect(fetch).toHaveBeenCalledTimes(4);
});
