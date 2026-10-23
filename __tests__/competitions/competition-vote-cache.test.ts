import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { updateCompetitionVoteInCache } from "@/components/react-query-wrapper/utils/updateCompetitionVoteInCache";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";

const scope = {
  wave_id: "wave",
  competition_id: "competition",
  viewer: "viewer:self",
};
const creditKey = [
  QueryKey.COMPETITION_CREDITS,
  { ...scope, entry_id: "entry" },
];
const contextKey = [
  QueryKey.COMPETITION_DROP_CONTEXT,
  { wave_id: "wave", drop_id: "drop", viewer: scope.viewer },
];
const resourceKey = [QueryKey.COMPETITION_RESOURCE, scope];
const budget = {
  competition_id: "competition",
  profile_id: "viewer",
  entry_id: "entry",
  credit_type: "TDH",
  credit_scope: "WAVE",
  available: 100,
  spent: 32,
  remaining: 68,
  current_vote: -25,
  min_vote: -93,
  max_vote: 93,
} as ApiCompetitionCreditBudget;
const result = {
  waveId: "wave",
  competitionId: "competition",
  entryId: "entry",
  dropId: "drop",
  viewer: scope.viewer,
  budget,
  isCurrentViewer: () => true,
};
const context = {
  competition: { id: "competition", wave_id: "wave" },
  entry: { id: "entry" },
  vote_summary: { user_vote: 10, rating: 90, realtime_rating: 125, rank: 3 },
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient();
});
afterEach(() => client.clear());

it("refreshes loaded pages after a vote moves across a page boundary", async () => {
  let order = ["other", "entry", "last"];
  const reads: number[] = [];
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  const observer = new InfiniteQueryObserver(client, {
    queryKey: [...resourceKey, "votes/me", { include: "cards" }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      reads.push(pageParam);
      if (order[0] === "entry") await refreshGate;
      return {
        data: [{ entry_id: order[pageParam]!, value: 10, credit_spent: 10 }],
        has_more: pageParam < order.length - 1,
        next_cursor: pageParam < order.length - 1 ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (page) => page.next_cursor,
  });
  const unsubscribe = observer.subscribe(() => undefined);
  try {
    await observer.refetch();
    await observer.fetchNextPage();
    const inactiveKey = [...resourceKey, "votes/me", {}];
    const inactiveRead = jest.fn(
      async () => observer.getCurrentResult().data!.pages[0]!
    );
    await client.fetchInfiniteQuery({
      queryKey: inactiveKey,
      initialPageParam: 0,
      queryFn: inactiveRead,
      getNextPageParam: (page: { next_cursor: number | null }) =>
        page.next_cursor,
    });
    inactiveRead.mockClear();
    reads.length = 0;
    order = ["entry", "other", "last"];
    await updateCompetitionVoteInCache(client, result);
    expect(observer.getCurrentResult().isFetching).toBe(true);
    // Exercise a request from a stale UI snapshot while the production
    // fire-and-forget invalidation is still refreshing the first page.
    const overlappingNextPage = observer.fetchNextPage({
      cancelRefetch: false,
    });
    expect(reads).toEqual([0]);
    releaseRefresh();
    await overlappingNextPage;
    expect(reads).toEqual([0, 1]);
    expect(client.getQueryState(inactiveKey)?.isInvalidated).toBe(true);
    expect(inactiveRead).not.toHaveBeenCalled();
    await observer.fetchNextPage({ cancelRefetch: false });
    expect(
      observer
        .getCurrentResult()
        .data?.pages.flatMap((page) => page.data.map((vote) => vote.entry_id))
    ).toEqual(order);
  } finally {
    unsubscribe();
  }
});

it("publishes confirmed credits and the viewer's vote without guessing totals or changing row order", async () => {
  const generalCreditKey = [QueryKey.COMPETITION_CREDITS, scope];
  client.setQueryData(generalCreditKey, {
    ...budget,
    entry_id: null,
    current_vote: null,
    spent: 17,
    remaining: 83,
  });
  client.setQueryData(contextKey, context);
  const dropKey = [...resourceKey, "drop", "entry", "drop"];
  client.setQueryData(dropKey, {
    entry: context.entry,
    drop: {
      id: "drop",
      rating: 90,
      rank: 3,
      context_profile_context: { rating: 10, reaction: "heart" },
      competition_context: {
        viewer: scope.viewer,
        waveId: "wave",
        dropId: "drop",
        data: context,
      },
    },
  });
  const cardKey = [...resourceKey, "card", "entry", "drop"];
  client.setQueryData(cardKey, client.getQueryData(dropKey));
  const votesKey = [...resourceKey, "votes/me", {}];
  const votes = {
    pageParams: [null, "older"],
    pages: [
      {
        data: [{ entry_id: "other", value: 7, credit_spent: 7 }],
        has_more: true,
        next_cursor: "older",
      },
      {
        data: [{ entry_id: "entry", value: 10, credit_spent: 10 }],
        has_more: false,
        next_cursor: null,
      },
    ],
  };
  client.setQueryData(votesKey, votes);
  const ranksKey = [...resourceKey, "leaderboard", {}];
  const ranks = {
    pages: [{ data: [{ entry_id: "entry", rating: 90, rank: 3 }] }],
    pageParams: [null],
  };
  client.setQueryData(ranksKey, ranks);
  await updateCompetitionVoteInCache(client, result);
  expect(client.getQueryData(creditKey)).toEqual(budget);
  expect(client.getQueryData(generalCreditKey)).toMatchObject({
    spent: 32,
    remaining: 68,
    current_vote: null,
  });
  expect(client.getQueryData(contextKey)).toEqual({
    ...context,
    vote_summary: { ...context.vote_summary, user_vote: -25 },
  });
  expect(client.getQueryData(dropKey)).toMatchObject({
    drop: {
      rating: 90,
      rank: 3,
      context_profile_context: { rating: -25, reaction: "heart" },
      competition_context: { data: { vote_summary: { user_vote: -25 } } },
    },
  });
  expect(client.getQueryData(cardKey)).toEqual(client.getQueryData(dropKey));
  expect(client.getQueryData(votesKey)).toEqual({
    ...votes,
    pages: [
      votes.pages[0],
      {
        ...votes.pages[1],
        data: [{ entry_id: "entry", value: -25, credit_spent: 25 }],
      },
    ],
  });
  expect(client.getQueryData(ranksKey)).toBe(ranks);
  expect(context.vote_summary.user_vote).toBe(10);
});

it("leaves other viewers, competitions, waves and entry-specific budgets untouched", async () => {
  const unrelated = [
    { ...scope, viewer: "viewer:proxy", entry_id: "entry" },
    { ...scope, competition_id: "other", entry_id: "entry" },
    { ...scope, wave_id: "other", entry_id: "entry" },
    { ...scope, entry_id: "other" },
  ];
  unrelated.forEach((key) =>
    client.setQueryData([QueryKey.COMPETITION_CREDITS, key], budget)
  );
  await updateCompetitionVoteInCache(client, result);
  for (const key of unrelated)
    expect(client.getQueryData([QueryKey.COMPETITION_CREDITS, key])).toBe(
      budget
    );
});

it.each([true, false])(
  "keeps retired leaderboard data independent for an original competition and viewer (%s)",
  async (isCurrent) => {
    client.setQueryData(
      [QueryKey.COMPETITION_HUB, { wave_id: "wave", viewer: scope.viewer }],
      { legacy_primary_competition_id: "competition" }
    );
    const key = [QueryKey.DROPS_LEADERBOARD, { waveId: "wave", sort: "RANK" }];
    const old = {
      pageParams: [1],
      pages: [
        {
          drops: [
            {
              id: "drop",
              rating: 90,
              rank: 3,
              context_profile_context: { rating: 10 },
            },
          ],
        },
      ],
    };
    client.setQueryData(key, old);
    await updateCompetitionVoteInCache(client, {
      ...result,
      isCurrentViewer: () => isCurrent,
    });
    expect(client.getQueryData(key)).toBe(old);
  }
);

it("does not patch a legacy leaderboard for an additional native competition", async () => {
  client.setQueryData(
    [QueryKey.COMPETITION_HUB, { wave_id: "wave", viewer: scope.viewer }],
    { legacy_primary_competition_id: "other" }
  );
  const key = [QueryKey.DROPS_LEADERBOARD, { waveId: "wave" }];
  const old = {
    pages: [
      { drops: [{ id: "drop", context_profile_context: { rating: 10 } }] },
    ],
    pageParams: [1],
  };
  client.setQueryData(key, old);
  await updateCompetitionVoteInCache(client, result);
  expect(client.getQueryData(key)).toBe(old);
});

it("does not publish the prior viewer's vote to shared data when cancellation changes the viewer", async () => {
  client.setQueryData(
    [QueryKey.COMPETITION_HUB, { wave_id: "wave", viewer: scope.viewer }],
    { legacy_primary_competition_id: "competition" }
  );
  const key = [QueryKey.DROPS_LEADERBOARD, { waveId: "wave" }];
  const old = {
    pages: [
      { drops: [{ id: "drop", context_profile_context: { rating: 10 } }] },
    ],
    pageParams: [1],
  };
  client.setQueryData(key, old);
  let isCurrentViewer = true;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  const read = client
    .fetchQuery({
      queryKey: creditKey,
      queryFn: ({ signal }) => {
        signal.addEventListener("abort", () => {
          isCurrentViewer = false;
        });
        started();
        return new Promise<ApiCompetitionCreditBudget>(() => undefined);
      },
    })
    .catch(() => undefined);
  await ready;
  await updateCompetitionVoteInCache(client, {
    ...result,
    isCurrentViewer: () => isCurrentViewer,
  });
  await read;
  expect(client.getQueryData(key)).toBe(old);
  expect(client.getQueryData(creditKey)).toEqual(budget);
});

it("cancels an older credit read so it cannot undo the saved vote", async () => {
  let release!: () => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  client.setQueryData(creditKey, { ...budget, current_vote: 10 });
  const read = client
    .fetchQuery({
      queryKey: creditKey,
      queryFn: () => {
        started();
        return new Promise<ApiCompetitionCreditBudget>((resolve) => {
          release = () => resolve({ ...budget, current_vote: 10 });
        });
      },
    })
    .catch(() => undefined);
  await ready;
  await updateCompetitionVoteInCache(client, result);
  release();
  await read;
  expect(client.getQueryData(creditKey)).toEqual(budget);
});
