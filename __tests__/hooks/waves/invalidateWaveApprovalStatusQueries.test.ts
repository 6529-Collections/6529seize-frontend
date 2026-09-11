import { QueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  applyWaveDropVoteUpdate,
  invalidateWaveApprovalStatusQueries,
} from "@/hooks/waves/invalidateWaveApprovalStatusQueries";

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

  it("patches only the voted drop and defers leaderboard refetching", () => {
    const leaderboardKey = [
      QueryKey.DROPS_LEADERBOARD,
      { waveId: "wave-1", page_size: 50, sort: "RANK" },
    ] as const;
    const otherLeaderboardKey = [
      QueryKey.DROPS_LEADERBOARD,
      { waveId: "wave-2", page_size: 50, sort: "RANK" },
    ] as const;
    const votersKey = [
      QueryKey.DROP_VOTERS,
      { dropId: "drop-1", pageSize: 20 },
    ] as const;
    const dropsKey = [
      QueryKey.DROPS,
      { waveId: "wave-1", limit: 50 },
    ] as const;
    const otherVotersKey = [
      QueryKey.DROP_VOTERS,
      { dropId: "drop-2", pageSize: 20 },
    ] as const;
    queryClient.setQueryData(leaderboardKey, {
      pages: [
        {
          page: 1,
          drops: [
            {
              id: "drop-1",
              rating: 1,
              title: "Keep this title",
              parts: [{ content: "Keep this content" }],
            },
            { id: "drop-2", rating: 2 },
          ],
        },
      ],
      pageParams: [null],
    });
    queryClient.setQueryData(otherLeaderboardKey, {
      pages: [{ page: 1, drops: [{ id: "drop-3", rating: 3 }] }],
      pageParams: [null],
    });
    queryClient.setQueryData(votersKey, { pages: [] });
    queryClient.setQueryData(dropsKey, {
      pages: [{ data: [{ id: "drop-1", rating: 1 }] }],
    });
    queryClient.setQueryData(otherVotersKey, { pages: [] });

    applyWaveDropVoteUpdate(
      queryClient,
      {
        id: "drop-1",
        rating: 99,
      } as any,
      "wave-1"
    );

    expect(
      queryClient.getQueryData<any>(leaderboardKey).pages[0].drops
    ).toEqual([
      expect.objectContaining({
        id: "drop-1",
        rating: 99,
        title: "Keep this title",
        parts: [{ content: "Keep this content" }],
      }),
      { id: "drop-2", rating: 2 },
    ]);
    expect(queryClient.getQueryData(otherLeaderboardKey)).toEqual({
      pages: [{ page: 1, drops: [{ id: "drop-3", rating: 3 }] }],
      pageParams: [null],
    });
    expect(queryClient.getQueryState(leaderboardKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(dropsKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(votersKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherVotersKey)?.isInvalidated).toBe(
      false
    );
  });
});
