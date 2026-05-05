import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useSingleWaveDropData } from "@/components/waves/drop/useSingleWaveDropData";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropV2ById: jest.fn(),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: { id: "wave-1" } }),
}));

const fetchDropV2ByIdMock = fetchDropV2ById as jest.MockedFunction<
  typeof fetchDropV2ById
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSingleWaveDropData", () => {
  it("fetches single-drop detail without eager top raters", async () => {
    fetchDropV2ByIdMock.mockResolvedValue({
      id: "drop-1",
      wave: { id: "wave-1" },
    } as any);

    renderHook(
      () =>
        useSingleWaveDropData(
          {
            id: "drop-1",
            wave: { id: "wave-1" },
            stableHash: "hash",
            stableKey: "key",
          } as any,
          jest.fn()
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(fetchDropV2ByIdMock).toHaveBeenCalledWith(
        "drop-1",
        expect.objectContaining({ aborted: false }),
        { includeTopRaters: false }
      );
    });
  });
});
