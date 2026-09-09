import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { useSingleWaveDropData } from "@/components/waves/drop/useSingleWaveDropData";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchDropVoteSummaryByIdV2 } from "@/services/api/drop-vote-summary-api";
import {
  fetchDropMetadataByIdV2,
  fetchDropV2ById,
} from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropMetadataByIdV2: jest.fn(),
  fetchDropV2ById: jest.fn(),
}));

jest.mock("@/services/api/drop-vote-summary-api", () => ({
  fetchDropVoteSummaryByIdV2: jest.fn(),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const useWaveDataMock = jest.fn();
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: (props: unknown) => useWaveDataMock(props),
}));

const fetchDropV2ByIdMock = fetchDropV2ById as jest.MockedFunction<
  typeof fetchDropV2ById
>;
const fetchDropVoteSummaryByIdV2Mock = jest.mocked(fetchDropVoteSummaryByIdV2);
const fetchDropMetadataByIdV2Mock =
  fetchDropMetadataByIdV2 as jest.MockedFunction<
    typeof fetchDropMetadataByIdV2
  >;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

const createInitialDrop = (id: string) =>
  ({
    id,
    wave: { id: "wave-1" },
    metadata: [{ data_key: "priority", data_value: id }],
    stableHash: `${id}-hash`,
    stableKey: `${id}-key`,
    type: DropSize.FULL,
  }) as any;

describe("useSingleWaveDropData", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useWaveDataMock.mockReturnValue({ data: { id: "wave-1" } });
    fetchDropVoteSummaryByIdV2Mock.mockResolvedValue({});
    fetchDropMetadataByIdV2Mock.mockResolvedValue([
      { data_key: "priority", data_value: "drop-1" },
      { data_key: "title", data_value: "Full Title" },
    ]);
  });

  it.each([
    [ApiDropType.Participatory, ApiWaveType.Rank, 1],
    [ApiDropType.Participatory, ApiWaveType.Approve, 0],
    [ApiDropType.Chat, ApiWaveType.Rank, 0],
  ])(
    "%s drop in %s wave makes %i summary request(s)",
    async (dropType, waveType, expectedRequests) => {
      useWaveDataMock.mockReturnValue({
        data: { id: "wave-1", wave: { type: waveType } },
      });
      const initialDrop = {
        ...createInitialDrop("drop-1"),
        drop_type: dropType,
      };
      const { result, rerender } = renderHook(
        () => useSingleWaveDropData(initialDrop, jest.fn()),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.drop.metadata).toHaveLength(2);
      });
      rerender();

      expect(fetchDropVoteSummaryByIdV2Mock).toHaveBeenCalledTimes(
        expectedRequests
      );
      if (expectedRequests > 0) {
        expect(fetchDropVoteSummaryByIdV2Mock).toHaveBeenCalledWith(
          "drop-1",
          expect.any(AbortSignal)
        );
      }
    }
  );

  it("fetches detail metadata without fetching single-drop detail", async () => {
    const initialDrop = createInitialDrop("drop-1");

    const { result } = renderHook(
      () => useSingleWaveDropData(initialDrop, jest.fn()),
      { wrapper: createWrapper() }
    );

    expect(fetchDropV2ByIdMock).not.toHaveBeenCalled();
    expect(fetchDropMetadataByIdV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "drop-1",
        priorityMetadata: initialDrop.metadata,
      })
    );
    expect(useWaveDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ waveId: "wave-1" })
    );
    expect(result.current.drop).toEqual(
      expect.objectContaining({
        id: "drop-1",
        metadata: initialDrop.metadata,
      })
    );

    await waitFor(() => {
      expect(result.current.drop.metadata).toEqual([
        { data_key: "priority", data_value: "drop-1" },
        { data_key: "title", data_value: "Full Title" },
      ]);
    });

    expect(result.current.extendedDrop).toEqual(
      expect.objectContaining({
        id: "drop-1",
        type: DropSize.FULL,
        stableHash: "drop-1-hash",
        stableKey: "drop-1-key",
        metadata: [
          { data_key: "priority", data_value: "drop-1" },
          { data_key: "title", data_value: "Full Title" },
        ],
      })
    );
  });

  it("switches directly to a new initial drop without exposing stale detail data", async () => {
    fetchDropMetadataByIdV2Mock.mockImplementation(async ({ dropId }) => [
      { data_key: "full", data_value: dropId },
    ]);

    const { result, rerender } = renderHook(
      ({ initialDrop }) => useSingleWaveDropData(initialDrop, jest.fn()),
      {
        initialProps: { initialDrop: createInitialDrop("drop-1") },
        wrapper: createWrapper(),
      }
    );

    expect(result.current.drop.id).toBe("drop-1");

    await waitFor(() => {
      expect(result.current.drop.metadata).toEqual([
        { data_key: "full", data_value: "drop-1" },
      ]);
    });

    rerender({ initialDrop: createInitialDrop("drop-2") });

    expect(result.current.drop.id).toBe("drop-2");
    expect(result.current.extendedDrop.id).toBe("drop-2");
    expect(result.current.drop.metadata).toEqual([
      { data_key: "priority", data_value: "drop-2" },
    ]);

    await waitFor(() => {
      expect(result.current.drop.metadata).toEqual([
        { data_key: "full", data_value: "drop-2" },
      ]);
    });

    expect(fetchDropMetadataByIdV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "drop-2",
        priorityMetadata: [{ data_key: "priority", data_value: "drop-2" }],
      })
    );
    expect(fetchDropV2ByIdMock).not.toHaveBeenCalled();
  });
});
