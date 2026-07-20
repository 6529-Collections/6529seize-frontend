import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useIdentitiesSearch } from "@/hooks/useIdentitiesSearch";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");

function TestComponent({
  handle,
  waveId,
}: {
  handle: string;
  waveId: string | null;
}) {
  const { identities } = useIdentitiesSearch({ handle, waveId });
  return <div>{identities.map((i) => i.handle).join(",")}</div>;
}

describe("useIdentitiesSearch", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (commonApiFetch as jest.Mock).mockResolvedValue([{ handle: "alice" }]);
  });

  it("searches the wave-scoped mention endpoint", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="ali" waveId="1" />
      </QueryClientProvider>
    );
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/waves/1/mention-search",
      params: { handle: "ali", limit: "5" },
      signal: expect.any(AbortSignal),
    });
    await screen.findByText("alice");
  });

  it("debounces requests while the handle changes", async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="al" waveId="1" />
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="ali" waveId="1" />
      </QueryClientProvider>
    );

    expect(commonApiFetch).not.toHaveBeenCalled();
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  });

  it("keeps matching suggestions visible while the next prefix is debounced", async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="ali" waveId="1" />
      </QueryClientProvider>
    );
    await screen.findByText("alice");

    rerender(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="alic" waveId="1" />
      </QueryClientProvider>
    );

    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("skips fetch when handle too short", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="al" waveId="1" />
      </QueryClientProvider>
    );
    await waitFor(() => expect(commonApiFetch).not.toHaveBeenCalled());
  });

  it("skips fetch when handle exceeds the API maximum", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="abcdefghijklmnop" waveId="1" />
      </QueryClientProvider>
    );

    await waitFor(() => expect(commonApiFetch).not.toHaveBeenCalled());
  });

  it("skips fetch when there is no wave to derive eligibility from", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="alice" waveId={null} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(commonApiFetch).not.toHaveBeenCalled());
  });
});
