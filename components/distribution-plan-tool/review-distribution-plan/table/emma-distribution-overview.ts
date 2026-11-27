import type { DistributionOverview } from "@/generated/models/DistributionOverview";

export type EmmaDistributionOverview = DistributionOverview & {
  /** Optional until the distribution API supplies a shared publish receipt. */
  readonly github_publication?: {
    readonly folder: string;
    readonly photos_changed: boolean;
  } | null;
};
