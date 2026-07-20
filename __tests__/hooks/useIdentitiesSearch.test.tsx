import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useIdentitiesSearch } from "@/hooks/useIdentitiesSearch";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");

function TestComponent({
  handle,
  waveId,
  visibilityGroupId,
}: {
  handle: string;
  waveId: string | null;
  visibilityGroupId?: string | null | undefined;
}) {
  const { identities } = useIdentitiesSearch({
    handle,
    visibilityGroupId,
    waveId,
  });
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

  it("searches the selected visibility group for a private draft wave", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent
          handle="ali"
          waveId={null}
          visibilityGroupId="visibility-group"
        />
      </QueryClientProvider>
    );

    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/waves/mention-search",
      params: {
        handle: "ali",
        limit: "5",
        visibility_group_id: "visibility-group",
      },
      signal: expect.any(AbortSignal),
    });
    await screen.findByText("alice");
  });

  it("searches the public audience for a public draft wave", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="ali" waveId={null} visibilityGroupId={null} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/waves/mention-search",
      params: { handle: "ali", limit: "5" },
      signal: expect.any(AbortSignal),
    });
    await screen.findByText("alice");
  });

  it("skips fetch when there is no wave or draft visibility scope", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent handle="alice" waveId={null} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(commonApiFetch).not.toHaveBeenCalled());
  });
});
