import {
  clampDropRatingRange,
  createInitialOptimisticRemainingVotePowerState,
  getEffectiveOptimisticRemainingVotePower,
  reduceOptimisticRemainingVotePower,
  restoreOptimisticRemainingVotePower,
} from "@/hooks/memesQuickVote.queue.state";

const createDrop = ({
  maxRating = 5_000,
  minRating = -5_000,
  rating = 0,
}: {
  readonly maxRating?: number;
  readonly minRating?: number;
  readonly rating?: number;
} = {}) =>
  ({
    context_profile_context: {
      rating,
      min_rating: minRating,
      max_rating: maxRating,
    },
  }) as any;

describe("memesQuickVote.queue.state", () => {
  it("spends and restores optimistic voting power by absolute amount", () => {
    const initial = createInitialOptimisticRemainingVotePowerState("session");
    const reduced = reduceOptimisticRemainingVotePower({
      amount: -250,
      current: initial,
      remainingPower: 5_000,
    });

    expect(reduced.value).toBe(4_750);

    const restored = restoreOptimisticRemainingVotePower({
      amount: -250,
      current: reduced,
      remainingPower: 5_000,
    });

    expect(restored.value).toBe(5_000);
  });

  it("clamps signed drop ranges with optimistic remaining voting power", () => {
    const clampedDrop = clampDropRatingRange(createDrop(), 4_750);

    expect(clampedDrop.context_profile_context?.max_rating).toBe(4_750);
    expect(clampedDrop.context_profile_context?.min_rating).toBe(-4_750);
  });

  it("clears an optimistic cap when the active drop already has less power", () => {
    expect(
      getEffectiveOptimisticRemainingVotePower({
        activeApiDrop: createDrop({ maxRating: 200, minRating: -200 }),
        state: {
          key: "session",
          value: 4_750,
        },
      })
    ).toBeNull();
  });
});
