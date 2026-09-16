import { useSubscriptionAllocationStatus } from "@/components/user/subscriptions/useSubscriptionAllocationStatus";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: { status?: number }) => error.status,
}));
const fetchMock = jest.mocked(commonApiFetch);
const profileKey =
  "0x1111111111111111111111111111111111111111-0x2222222222222222222222222222222222222222";
const baseProps = {
  profileKey,
  contract: "0xcontract",
  tokenId: 548,
  first: true,
  subscribed: true,
};
let client: QueryClient;
function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  fetchMock.mockReset();
});
afterEach(() => client.clear());

it("reports absent allocation only after distribution is published", async () => {
  fetchMock.mockImplementation(async ({ endpoint }) => {
    if (endpoint.startsWith("subscriptions/")) throw { status: 404 };
    return { has_distribution: true, allocations: [] };
  });
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus(baseProps),
    { wrapper }
  );
  await waitFor(() => expect(result.current.hasNoAllocation).toBe(true));
  expect(fetchMock).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { wallet: profileKey.split("-")[0] },
      includeWalletAuth: false,
    })
  );
});
it("keeps a phase-less finalized subscription in the pending state", async () => {
  fetchMock.mockResolvedValue({ phase: null, phase_position: -1 });
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus(baseProps),
    { wrapper }
  );
  await waitFor(() =>
    expect(result.current.final).toEqual({
      phase: null,
      phase_position: -1,
    })
  );
  expect(result.current.hasNoAllocation).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("does not report absent allocation before publication", async () => {
  fetchMock
    .mockRejectedValueOnce({ status: 404 })
    .mockResolvedValueOnce({ has_distribution: false, allocations: [] });
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus(baseProps),
    { wrapper }
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(result.current.hasNoAllocation).toBe(false);
});
it.each([401, 403, 500])(
  "does not turn final-subscription HTTP %s into no allocation",
  async (status) => {
    fetchMock.mockRejectedValue({ status });
    const { result } = renderHook(
      () => useSubscriptionAllocationStatus(baseProps),
      { wrapper }
    );
    await waitFor(() =>
      expect(client.getQueryCache().getAll()[0]?.state.status).toBe("error")
    );
    expect(result.current.hasNoAllocation).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);
it("does not report absence if publication lookup fails", async () => {
  fetchMock
    .mockRejectedValueOnce({ status: 404 })
    .mockRejectedValueOnce({ status: 500 });
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus(baseProps),
    { wrapper }
  );
  await waitFor(() =>
    expect(client.getQueryCache().getAll()[1]?.state.status).toBe("error")
  );
  expect(result.current.hasNoAllocation).toBe(false);
});
it.each([0, 12])(
  "does not report absence for an assigned phase, even with position %s",
  async (position) => {
    fetchMock.mockResolvedValue({ phase: "Phase 1", phase_position: position });
    const { result } = renderHook(
      () => useSubscriptionAllocationStatus(baseProps),
      { wrapper }
    );
    await waitFor(() => expect(result.current.final?.phase).toBe("Phase 1"));
    expect(result.current.hasNoAllocation).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);
it.each([
  { subscribed: false, first: true },
  { subscribed: true, first: false },
])("does not query allocation status for an inactive row (%j)", (props) => {
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus({ ...baseProps, ...props }),
    { wrapper }
  );
  expect(result.current.hasNoAllocation).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("does not reuse a previous profile's absence while the new profile loads", async () => {
  fetchMock
    .mockRejectedValueOnce({ status: 404 })
    .mockResolvedValueOnce({ has_distribution: true, allocations: [] });
  const { result, rerender } = renderHook(
    (props) => useSubscriptionAllocationStatus(props),
    { initialProps: baseProps, wrapper }
  );
  await waitFor(() => expect(result.current.hasNoAllocation).toBe(true));
  fetchMock.mockImplementation(() => new Promise(() => undefined));
  rerender({
    ...baseProps,
    profileKey: "0x3333333333333333333333333333333333333333",
  });
  expect(result.current.hasNoAllocation).toBe(false);
});
it("does not confuse wallet allowlist spots with a subscription allocation", async () => {
  fetchMock.mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce({
    has_distribution: true,
    allocations: [{ phase: "Phase 1", spots_allowlist: 2, spots_airdrop: 0 }],
  });
  const { result } = renderHook(
    () => useSubscriptionAllocationStatus(baseProps),
    { wrapper }
  );
  await waitFor(() => expect(result.current.hasNoAllocation).toBe(true));
});
