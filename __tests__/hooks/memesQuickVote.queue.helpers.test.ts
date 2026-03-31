import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  createInitialMemesQuickVoteDiscoveryState,
  deferMemesQuickVoteDropId,
  deriveMemesQuickVoteDiscoverySnapshot,
  isMemesQuickVoteExhausted,
  removeMemesQuickVoteDropId,
} from "@/hooks/memesQuickVote.queue.helpers";

const createDrop = (id: string) =>
  ({
    id,
    serial_no: 1,
    drop_type: ApiDropType.Participatory,
    context_profile_context: {
      rating: 0,
      max_rating: 5_000,
    },
    wave: {
      id: "wave-1",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: true,
      voting_period_start: null,
      voting_period_end: null,
    },
    author: {
      handle: "artist",
      primary_address: "0x123",
    },
    parts: [
      {
        content: "hello",
        media: [],
      },
    ],
    metadata: [],
    created_at: new Date(1_000).toISOString(),
  }) as any;

const createPage = ({
  dropIds,
  nextPage,
  pageCount,
}: {
  readonly dropIds: readonly string[];
  readonly nextPage: number | null;
  readonly pageCount: number;
}) => ({
  drops: dropIds.map(createDrop),
  nextPage,
  pageCount,
});

describe("memesQuickVote.queue.helpers", () => {
  it("rebuilds deferred drops using persisted skip order instead of page order", () => {
    const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
      enabled: true,
      pages: [
        createPage({
          dropIds: ["drop-a", "drop-b", "drop-c", "drop-d"],
          nextPage: null,
          pageCount: 4,
        }),
      ],
      skippedDropIds: ["drop-a", "drop-c", "drop-b"],
      state: createInitialMemesQuickVoteDiscoveryState(),
    });

    expect(snapshot.deferredIds).toEqual(["drop-a", "drop-c", "drop-b"]);
    expect(snapshot.activeIds).toEqual(["drop-d"]);
  });

  it("preserves persisted skip order across multiple discovery pages", () => {
    const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
      enabled: true,
      pages: [
        createPage({
          dropIds: ["drop-b"],
          nextPage: 2,
          pageCount: 4,
        }),
        createPage({
          dropIds: ["drop-a", "drop-c", "drop-d"],
          nextPage: null,
          pageCount: 4,
        }),
      ],
      skippedDropIds: ["drop-a", "drop-c", "drop-b"],
      state: createInitialMemesQuickVoteDiscoveryState(),
    });

    expect(snapshot.deferredIds).toEqual(["drop-a", "drop-c", "drop-b"]);
    expect(snapshot.activeIds).toEqual(["drop-d"]);
  });

  it("keeps local defer order ahead of stale persisted skip ordering", () => {
    const localState = deferMemesQuickVoteDropId({
      dropId: "drop-b",
      state: createInitialMemesQuickVoteDiscoveryState(),
    });
    const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
      enabled: true,
      pages: [
        createPage({
          dropIds: ["drop-a", "drop-b", "drop-c", "drop-d"],
          nextPage: null,
          pageCount: 4,
        }),
      ],
      skippedDropIds: ["drop-a", "drop-b", "drop-c"],
      state: localState,
    });

    expect(snapshot.deferredIds).toEqual(["drop-a", "drop-c", "drop-b"]);
    expect(snapshot.activeIds).toEqual(["drop-d"]);
  });

  it("filters removed ids out of the derived queue", () => {
    const localState = removeMemesQuickVoteDropId({
      dropId: "drop-a",
      state: createInitialMemesQuickVoteDiscoveryState(),
    });
    const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
      enabled: true,
      pages: [
        createPage({
          dropIds: ["drop-a"],
          nextPage: null,
          pageCount: 1,
        }),
      ],
      skippedDropIds: [],
      state: localState,
    });

    expect(snapshot.activeIds).toEqual([]);
    expect(snapshot.deferredIds).toEqual([]);
    expect(snapshot.nextPage).toBeNull();
    expect(isMemesQuickVoteExhausted(snapshot)).toBe(true);
  });
});
