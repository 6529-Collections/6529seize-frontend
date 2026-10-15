import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWavesV2 } from "@/hooks/useWavesV2";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";

jest.mock("@/services/api/waves-v2-api", () => ({
  ...jest.requireActual("@/services/api/waves-v2-api"),
  fetchWavesV2Page: jest.fn(),
}));

const fetchWavesV2PageMock = fetchWavesV2Page as jest.Mock;

const createWrapper = (staleTime: number) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime } },
  });
  const Wrapper = ({ children }: { readonly children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const renderWavesV2 = (staleTime: number, enabled = true) =>
  renderHook(
    () =>
      useWavesV2({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        enabled,
      }),
    { wrapper: createWrapper(staleTime) }
  );

beforeEach(() => {
  fetchWavesV2PageMock.mockReset().mockResolvedValue({
    waves: [],
    page: 1,
    next: false,
  });
});

describe("useWavesV2 refetchIfStale", () => {
  it("keeps a list that is still within its staleTime", async () => {
    const { result } = renderWavesV2(60_000);
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.refetchIfStale();
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(1);
  });

  it("refetches a list past its staleTime", async () => {
    const { result } = renderWavesV2(0);
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.refetchIfStale();
    });

    await waitFor(() => expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(2));
  });

  it("does not fetch a disabled list", async () => {
    const { result } = renderWavesV2(0, false);

    act(() => {
      result.current.refetchIfStale();
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchWavesV2PageMock).not.toHaveBeenCalled();
  });
});
