import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([{ id: "1" }, { id: "2" }])),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test("fetches logs", async () => {
  const { result } = renderHook(
    () =>
      useWaveActivityLogs({
        waveId: "w",
        connectedProfileHandle: "h",
        reverse: false,
        dropId: null,
        logTypes: [],
      }),
    { wrapper: createWrapper() }
  );
  await waitFor(() => expect(result.current.logs.length).toBe(2));
});

test("reverses logs when reverse true", async () => {
  const { result } = renderHook(
    () =>
      useWaveActivityLogs({
        waveId: "w",
        connectedProfileHandle: "h",
        reverse: true,
        dropId: null,
        logTypes: [],
      }),
    { wrapper: createWrapper() }
  );
  await waitFor(() => expect(result.current.logs[0]?.id).toBe("2"));
});

test("prefetches logs on mount", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const spy = jest.spyOn(queryClient, "prefetchInfiniteQuery");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(
    () =>
      useWaveActivityLogs({
        waveId: "w",
        connectedProfileHandle: "h",
        reverse: false,
        dropId: null,
        logTypes: [],
      }),
    { wrapper }
  );
  expect(spy).toHaveBeenCalled();
});

test.each([false, true])(
  "preserves nullable historical timestamps, proxy and contents in server order (reverse %s)",
  async (reverse) => {
    const historical = {
      id: "old",
      created_at: null,
      invoker_proxy: { id: "retained-proxy" },
      contents: { oldVote: 7, newVote: 0, reason: "CREDIT_OVERSPENT" },
    };
    const recent = {
      id: "new",
      created_at: "2026-10-20T00:00:00Z",
      contents: { oldVote: 0, newVote: 3 },
    };
    const logs = [historical, recent];
    jest.mocked(commonApiFetch).mockResolvedValue(logs);
    const { result } = renderHook(
      () =>
        useWaveActivityLogs({
          waveId: "w",
          connectedProfileHandle: "h",
          reverse,
          dropId: null,
          logTypes: [],
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() =>
      expect(result.current.logs.map((log) => log.id)).toEqual(
        reverse ? ["new", "old"] : ["old", "new"]
      )
    );
    expect(result.current.logs.find((log) => log.id === "old")).toBe(
      historical
    );
    expect(historical.created_at).toBeNull();
    expect(historical.invoker_proxy).toEqual({ id: "retained-proxy" });
    expect(historical.contents).toEqual({
      oldVote: 7,
      newVote: 0,
      reason: "CREDIT_OVERSPENT",
    });
    expect(logs.map((log) => log.id)).toEqual(["old", "new"]);
  }
);
