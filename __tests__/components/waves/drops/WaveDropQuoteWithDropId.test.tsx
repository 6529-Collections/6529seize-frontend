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
jest.mock("@tanstack/react-query", () => ({
  useQuery: (opts: any) => useQuery(opts),
  keepPreviousData: "keep",
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
    const call = useQuery.mock.calls[0][0];
    expect(call.queryKey).toEqual([QueryKey.DROP, { drop_id: "d1" }]);
    expect(call.enabled).toBe(true);
    expect(call.staleTime).toBe(60000);
    expect(call).not.toHaveProperty("initialData");
    expect(call).not.toHaveProperty("initialDataUpdatedAt");
    await call.queryFn();
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("d1");
  });

  it("treats maybeDrop as stale initial data and fetches fresh data", async () => {
    const maybeDrop = { id: "d1", wave: { id: "old-wave" } };
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
    const call = useQuery.mock.calls[0][0];
    expect(call.queryKey).toEqual([QueryKey.DROP, { drop_id: "d1" }]);
    expect(call.enabled).toBe(true);
    expect(call.initialData).toBe(maybeDrop);
    expect(call.initialDataUpdatedAt).toBe(0);
    await call.queryFn();
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("d1");
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
    const call = useQuery.mock.calls[0][0];
    expect(call.enabled).toBe(true);
  });
});
