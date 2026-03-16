import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  addRecentQuickVoteAmount,
  appendSkippedSerial,
  buildMemesQuickVoteQueue,
  deriveMemesQuickVoteStats,
  getDisplayQuickVoteAmounts,
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
    ).toEqual([500, 250, 1000, 2000, 3000]);
    expect(appendSkippedSerial([30, 10, 20], 10)).toEqual([30, 20, 10]);
  });
});
