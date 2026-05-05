import { QueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { invalidateWaveApprovalStatusQueries } from "@/hooks/waves/invalidateWaveApprovalStatusQueries";

describe("invalidateWaveApprovalStatusQueries", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("invalidates the wave and matching decision queries", () => {
    const waveKey = [QueryKey.WAVE, { wave_id: "wave-1" }];
    const decisionsKey = [
      QueryKey.WAVE_DECISIONS,
      { waveId: "wave-1", pageSize: 2000 },
    ];
    queryClient.setQueryData(waveKey, { id: "wave-1" });
    queryClient.setQueryData(decisionsKey, { pages: [], pageParams: [] });

    invalidateWaveApprovalStatusQueries(queryClient, "wave-1");

    expect(queryClient.getQueryState(waveKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(decisionsKey)?.isInvalidated).toBe(true);
  });

  it("does nothing without a wave id", () => {
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

    invalidateWaveApprovalStatusQueries(queryClient, null);
    invalidateWaveApprovalStatusQueries(queryClient, undefined);
    invalidateWaveApprovalStatusQueries(queryClient, "");

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
