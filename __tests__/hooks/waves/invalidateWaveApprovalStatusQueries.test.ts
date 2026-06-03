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

  it("invalidates approval-related queries for the matching wave only", () => {
    const waveKey = [QueryKey.WAVE, { wave_id: "wave-1" }] as const;
    const decisionsKey = [
      QueryKey.WAVE_DECISIONS,
      { waveId: "wave-1", pageSize: 2000 },
    ] as const;
    const dropsLeaderboardKey = [
      QueryKey.DROPS_LEADERBOARD,
      { waveId: "wave-1", page_size: 20 },
    ] as const;
    const dropsKey = [
      QueryKey.DROPS,
      { waveId: "wave-1", limit: 20 },
    ] as const;
    const dropVotersKey = [QueryKey.DROP_VOTERS, { dropId: "drop-1" }] as const;
    const dropVoteLogsKey = [
      QueryKey.DROP_VOTE_LOGS,
      { dropId: "drop-1" },
    ] as const;
    const otherWaveKey = [QueryKey.WAVE, { wave_id: "wave-2" }] as const;
    const otherDecisionsKey = [
      QueryKey.WAVE_DECISIONS,
      { waveId: "wave-2", pageSize: 2000 },
    ] as const;
    const otherDropsLeaderboardKey = [
      QueryKey.DROPS_LEADERBOARD,
      { waveId: "wave-2", page_size: 20 },
    ] as const;
    const otherDropsKey = [
      QueryKey.DROPS,
      { waveId: "wave-2", limit: 20 },
    ] as const;
    queryClient.setQueryData(waveKey, { id: "wave-1" });
    queryClient.setQueryData(decisionsKey, { pages: [], pageParams: [] });
    queryClient.setQueryData(dropsLeaderboardKey, { pages: [] });
    queryClient.setQueryData(dropsKey, { pages: [] });
    queryClient.setQueryData(dropVotersKey, { pages: [] });
    queryClient.setQueryData(dropVoteLogsKey, { pages: [] });
    queryClient.setQueryData(otherWaveKey, { id: "wave-2" });
    queryClient.setQueryData(otherDecisionsKey, { pages: [], pageParams: [] });
    queryClient.setQueryData(otherDropsLeaderboardKey, { pages: [] });
    queryClient.setQueryData(otherDropsKey, { pages: [] });

    invalidateWaveApprovalStatusQueries(queryClient, "wave-1");

    expect(queryClient.getQueryState(waveKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(decisionsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(dropsLeaderboardKey)?.isInvalidated).toBe(
      true
    );
    expect(queryClient.getQueryState(dropsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(dropVotersKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(dropVoteLogsKey)?.isInvalidated).toBe(
      true
    );
    expect(queryClient.getQueryState(otherWaveKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(otherDecisionsKey)?.isInvalidated).toBe(
      false
    );
    expect(
      queryClient.getQueryState(otherDropsLeaderboardKey)?.isInvalidated
    ).toBe(false);
    expect(queryClient.getQueryState(otherDropsKey)?.isInvalidated).toBe(false);
  });

  it("does nothing without a wave id", () => {
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

    invalidateWaveApprovalStatusQueries(queryClient, null);
    invalidateWaveApprovalStatusQueries(queryClient, undefined);
    invalidateWaveApprovalStatusQueries(queryClient, "");

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
