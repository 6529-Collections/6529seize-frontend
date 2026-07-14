import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";

export interface Join6529Facts {
  readonly hasCollected: boolean;
  readonly hasParticipated: boolean;
}

export const hasCollectedSupportedNft = (
  stats:
    | Pick<
        ApiCollectedStats,
        "gradients_balance" | "memes_balance" | "nextgen_balance"
      >
    | null
    | undefined
): boolean =>
  Boolean(
    stats &&
    (stats.memes_balance > 0 ||
      stats.nextgen_balance > 0 ||
      stats.gradients_balance > 0)
  );

export const hasPublicWavePost = (
  activity: { readonly date_samples: readonly number[] } | null | undefined
): boolean => activity?.date_samples.some((count) => count > 0) ?? false;
