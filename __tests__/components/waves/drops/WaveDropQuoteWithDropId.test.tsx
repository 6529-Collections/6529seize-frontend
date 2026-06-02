import { render } from "@testing-library/react";
import React from "react";
import WaveDropQuoteWithDropId from "@/components/waves/drops/WaveDropQuoteWithDropId";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchDropByIdBatched } from "@/services/api/drop-api";

let capturedProps: any;
jest.mock("@/components/waves/drops/WaveDropQuote", () => (props: any) => {
  capturedProps = props;
  return <div data-testid="quote" />;
});

const useQuery = jest.fn();
const getQueryData = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (opts: any) => useQuery(opts),
  useQueryClient: () => ({ getQueryData }),
  keepPreviousData: "keep",
}));

const useMyStreamOptional = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => useMyStreamOptional(),
}));

jest.mock("@/services/api/drop-api", () => {
  const { QueryKey: ActualQueryKey } = jest.requireActual(
    "@/components/react-query-wrapper/ReactQueryWrapper"
  );
  return {
    DROP_DETAIL_STALE_TIME_MS: 60 * 1000,
    fetchDropByIdBatched: jest.fn(async () => ({ id: "d1" })),
    getDropQueryKey: (dropId: string | null | undefined) => [
      ActualQueryKey.DROP,
      { drop_id: dropId ?? null },
    ],
  };
});

const fetchDropByIdBatchedMock = fetchDropByIdBatched as jest.Mock;

describe("WaveDropQuoteWithDropId", () => {
  beforeEach(() => {
    capturedProps = undefined;
    jest.clearAllMocks();
    getQueryData.mockReturnValue(undefined);
    useMyStreamOptional.mockReturnValue(null);
  });

  it("fetches drop by drop ID and renders quote when no maybeDrop exists", async () => {
    useQuery.mockImplementation((opts: any) => {
      return { data: { id: "d1", wave: { id: "w1" } } };
    });
    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={null}
        onQuoteClick={jest.fn()}
      />
    );
    expect(capturedProps.drop).toEqual({ id: "d1", wave: { id: "w1" } });
    expect(capturedProps.isNotFound).toBe(false);
    const call = useQuery.mock.calls[0][0];
    expect(call.queryKey).toEqual([QueryKey.DROP, { drop_id: "d1" }]);
    expect(call.enabled).toBe(true);
    expect(call.staleTime).toBe(60000);
    expect(call).not.toHaveProperty("initialData");
    expect(call).not.toHaveProperty("initialDataUpdatedAt");
    await call.queryFn();
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("d1");
  });

  it("uses maybeDrop without fetching fresh data", () => {
    const maybeDrop = {
      id: "d1",
      wave: { id: "old-wave" },
      hide_link_preview: true,
    };
    useQuery.mockImplementation((opts: any) => {
      return { data: opts.initialData };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId=" d1 "
        partId={2}
        maybeDrop={maybeDrop as any}
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBe(maybeDrop);
    expect(capturedProps.hideLinkPreviews).toBeTruthy();
    expect(capturedProps.isNotFound).toBe(false);
    const call = useQuery.mock.calls[0][0];
    expect(call.queryKey).toEqual([QueryKey.DROP, { drop_id: "d1" }]);
    expect(call.enabled).toBe(false);
    expect(call.initialData).toBe(maybeDrop);
    expect(call).not.toHaveProperty("initialDataUpdatedAt");
    expect(fetchDropByIdBatchedMock).not.toHaveBeenCalled();
  });

  it("uses an already cached drop without fetching fresh data", () => {
    const cachedDrop = { id: "d1", wave: { id: "cached-wave" } };
    getQueryData.mockReturnValue(cachedDrop);
    useQuery.mockImplementation((opts: any) => {
      return { data: opts.initialData };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={null}
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBe(cachedDrop);
    const call = useQuery.mock.calls[0][0];
    expect(call.enabled).toBe(false);
    expect(call.initialData).toBe(cachedDrop);
  });

  it("uses a full drop from wave messages without fetching by id", () => {
    const waveDrop = {
      id: "d1",
      wave: { id: "w1" },
      type: "FULL",
      stableKey: "d1",
      stableHash: "d1",
    };
    useMyStreamOptional.mockReturnValue({
      activeWave: { id: "w1" },
      waveMessagesStore: {
        getData: jest.fn(() => ({ drops: [waveDrop] })),
      },
    });
    useQuery.mockImplementation((opts: any) => {
      return { data: opts.initialData };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={null}
        waveId="w1"
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBe(waveDrop);
    const call = useQuery.mock.calls[0][0];
    expect(call.enabled).toBe(false);
    expect(call.initialData).toBe(waveDrop);
  });

  it("passes not-found state when the refresh returns the not-found message", () => {
    useQuery.mockImplementation(() => {
      return {
        data: undefined,
        error: new Error("Drop d1 not found"),
      };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={null}
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBeNull();
    expect(capturedProps.isNotFound).toBe(true);
  });

  it("does not render stale maybeDrop when the refresh reports not found", () => {
    const maybeDrop = { id: "d1", wave: { id: "old-wave" } };
    useQuery.mockImplementation((opts: any) => {
      return {
        data: opts.initialData,
        error: new Error("Drop d1 not found"),
      };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={maybeDrop as any}
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBeNull();
    expect(capturedProps.isNotFound).toBe(true);
    const call = useQuery.mock.calls[0][0];
    expect(call.enabled).toBe(false);
  });

  it("passes not-found state when the refresh returns a 404", () => {
    const maybeDrop = { id: "d1", wave: { id: "old-wave" } };
    useQuery.mockImplementation((opts: any) => {
      return {
        data: opts.initialData,
        error: { response: { status: 404 } },
      };
    });

    render(
      <WaveDropQuoteWithDropId
        dropId="d1"
        partId={2}
        maybeDrop={maybeDrop as any}
        onQuoteClick={jest.fn()}
      />
    );

    expect(capturedProps.drop).toBeNull();
    expect(capturedProps.isNotFound).toBe(true);
  });
});
