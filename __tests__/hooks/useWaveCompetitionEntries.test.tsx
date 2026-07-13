import { useWaveCompetitionEntries } from "@/hooks/useWaveCompetitionEntries";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { fetchWaveCompetitionDropsV2 } from "@/services/api/wave-drops-v2-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWaveCompetitionDropsV2: jest.fn(),
}));

jest.mock("@/services/api/drop-api", () => ({
  DROP_BATCH_STALE_TIME_MS: 300_000,
  seedDropCache: jest.fn(),
}));

const fetchCompetitionDropsMock =
  fetchWaveCompetitionDropsV2 as jest.MockedFunction<
    typeof fetchWaveCompetitionDropsV2
  >;

const wave = { id: "wave-1", name: "Cool Comp" } as ApiWaveMin;
const entry = { id: "entry-1" } as ApiDrop;

describe("useWaveCompetitionEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchCompetitionDropsMock.mockResolvedValue({
      data: [entry],
      page: 1,
      next: false,
    });
  });

  it("does not request full drops until the badge modal is open", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useWaveCompetitionEntries({
          authorId: "author-1",
          wave,
          kind: "active",
          enabled,
        }),
      { initialProps: { enabled: false }, wrapper }
    );

    expect(fetchCompetitionDropsMock).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.entries).toEqual([entry]));
    expect(fetchCompetitionDropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave,
        authorId: "author-1",
        page: 1,
        pageSize: 50,
      })
    );
  });
});
