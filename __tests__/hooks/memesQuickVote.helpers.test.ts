import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  addRecentQuickVoteAmount,
  appendSkippedSerial,
  buildMemesQuickVoteQueue,
  deriveMemesQuickVoteEffectiveDrops,
  deriveMemesQuickVoteStats,
  getDisplayQuickVoteAmounts,
  getDefaultQuickVoteAmount,
  sanitizeStoredAmounts,
  sanitizeStoredSerials,
} from "@/hooks/memesQuickVote.helpers";

const createDrop = ({
  id,
  serialNo,
  rating = 0,
  maxRating = 5_000,
  eligible = true,
}: {
  readonly id: string;
  readonly serialNo: number;
  readonly rating?: number;
  readonly maxRating?: number;
  readonly eligible?: boolean;
}) =>
  ({
    id,
    serial_no: serialNo,
    drop_type: ApiDropType.Participatory,
    context_profile_context: {
      rating,
      max_rating: maxRating,
    },
    wave: {
      id: "wave-1",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: eligible,
    },
    author: {
      handle: `artist-${serialNo}`,
      primary_address: `0x${serialNo}`,
    },
    parts: [],
    metadata: [],
    created_at: new Date(serialNo * 1_000).toISOString(),
  }) as any;

describe("memesQuickVote.helpers", () => {
  it("moves skipped serials to the tail while keeping live newest-first order", () => {
    const queue = buildMemesQuickVoteQueue(
      [
        createDrop({ id: "drop-30", serialNo: 30 }),
        createDrop({ id: "drop-20", serialNo: 20 }),
        createDrop({ id: "drop-10", serialNo: 10 }),
      ],
      [10, 30, 999]
    );

    expect(queue.map((drop) => drop.serial_no)).toEqual([20, 10, 30]);
  });

  it("derives footer stats only from quick-vote eligible drops", () => {
    const stats = deriveMemesQuickVoteStats([
      createDrop({ id: "eligible-a", serialNo: 20, rating: 0, maxRating: 500 }),
      createDrop({ id: "ineligible-voted", serialNo: 19, rating: 3 }),
      createDrop({
        id: "ineligible-flagged",
        serialNo: 18,
        rating: 0,
        eligible: false,
      }),
      createDrop({ id: "eligible-b", serialNo: 17, rating: 0, maxRating: 250 }),
    ]);

    expect(stats).toEqual({
      uncastPower: 500,
      unratedCount: 2,
      votingLabel: "TDH",
    });
  });

  it("removes voted drops from the effective quick-vote list", () => {
    const effectiveDrops = deriveMemesQuickVoteEffectiveDrops(
      [
        createDrop({ id: "drop-30", serialNo: 30 }),
        createDrop({ id: "drop-20", serialNo: 20 }),
        createDrop({ id: "drop-10", serialNo: 10 }),
      ],
      [20],
      null
    );

    expect(effectiveDrops.map((drop) => drop.serial_no)).toEqual([30, 10]);
  });

  it("clamps remaining unrated drops to the optimistic remaining power", () => {
    const effectiveDrops = deriveMemesQuickVoteEffectiveDrops(
      [
        createDrop({ id: "drop-30", serialNo: 30, maxRating: 5_000 }),
        createDrop({ id: "drop-20", serialNo: 20, maxRating: 5_000 }),
        createDrop({
          id: "drop-10",
          serialNo: 10,
          rating: 100,
          maxRating: 900,
        }),
      ],
      [30],
      4_000
    );

    expect(
      effectiveDrops.map((drop) => drop.context_profile_context?.max_rating)
    ).toEqual([4_000, 900]);
  });

  it("returns the original drops when there is no live optimistic vote", () => {
    const drops = [
      createDrop({ id: "drop-30", serialNo: 30 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];

    expect(deriveMemesQuickVoteEffectiveDrops(drops, [], null)).toBe(drops);
  });

  it("keeps the last five unique quick-vote amounts but renders them ascending", () => {
    const recent = [50, 125, 250, 500];
    const withDuplicate = addRecentQuickVoteAmount(recent, 125);
    const withNewAmount = addRecentQuickVoteAmount(withDuplicate, 1_000);
    const capped = addRecentQuickVoteAmount(withNewAmount, 2_000);

    expect(capped).toEqual([250, 500, 125, 1_000, 2_000]);
    expect(getDisplayQuickVoteAmounts(capped)).toEqual([
      125, 250, 500, 1000, 2000,
    ]);
  });

  it("derives the initial custom quick-vote amount from one percent of max power", () => {
    expect(getDefaultQuickVoteAmount(5_000)).toBe(50);
    expect(getDefaultQuickVoteAmount(99)).toBe(1);
    expect(getDefaultQuickVoteAmount(1)).toBe(1);
  });

  it("sanitizes stored arrays and moves re-skipped serials to the end", () => {
    expect(sanitizeStoredSerials([20, 20, "x", 10, -1, 5.5, 30, null])).toEqual(
      [20, 10, 30]
    );
    expect(
      sanitizeStoredAmounts([
        500,
        500,
        "250",
        250,
        0,
        1000,
        2000,
        3000,
        4000,
        5000,
      ])
    ).toEqual([1000, 2000, 3000, 4000, 5000]);
    expect(appendSkippedSerial([30, 10, 20], 10)).toEqual([30, 20, 10]);
  });
});
