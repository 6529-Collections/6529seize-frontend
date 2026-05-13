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

const createInitialDrop = (id: string) =>
  ({
    id,
    wave: { id: "wave-1" },
    stableHash: `${id}-hash`,
    stableKey: `${id}-key`,
  }) as any;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

describe("useSingleWaveDropData", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

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

  it("does not expose the previous drop while a new drop id is loading", async () => {
    const secondDrop = createDeferred<any>();
    fetchDropV2ByIdMock
      .mockResolvedValueOnce({
        id: "drop-1",
        wave: { id: "wave-1" },
      } as any)
      .mockReturnValueOnce(secondDrop.promise);

    const { result, rerender } = renderHook(
      ({ initialDrop }) => useSingleWaveDropData(initialDrop, jest.fn()),
      {
        initialProps: { initialDrop: createInitialDrop("drop-1") },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.drop?.id).toBe("drop-1");
    });

    rerender({ initialDrop: createInitialDrop("drop-2") });

    expect(result.current.drop).toBeUndefined();
    expect(result.current.extendedDrop).toBeNull();

    secondDrop.resolve({
      id: "drop-2",
      wave: { id: "wave-1" },
    });

    await waitFor(() => {
      expect(result.current.drop?.id).toBe("drop-2");
    });
  });
});
