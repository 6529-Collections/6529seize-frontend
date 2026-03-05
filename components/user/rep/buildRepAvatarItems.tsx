import { formatNumberWithCommas } from "@/helpers/Helpers";

interface ContributorData {
  readonly profile: {
    readonly handle: string | null;
    readonly primary_address: string;
    readonly pfp: string | null;
  };
  readonly contribution: number;
}

export function buildRepAvatarItems(
  contributors: readonly ContributorData[],
  maxCount: number,
  options?: { omitHref?: boolean }
) {
  return contributors.slice(0, maxCount).map((c) => ({
    key: c.profile.handle ?? c.profile.primary_address,
    pfpUrl: c.profile.pfp ?? null,
    ...(options?.omitHref
      ? {}
      : { href: `/${c.profile.handle ?? c.profile.primary_address}` }),
    ariaLabel: c.profile.handle ?? c.profile.primary_address,
    fallback: c.profile.handle
      ? c.profile.handle.charAt(0).toUpperCase()
      : "?",
    title: c.profile.handle ?? c.profile.primary_address,
    tooltipContent: (
      <span>
        {c.profile.handle ?? c.profile.primary_address} &middot;{" "}
        {formatNumberWithCommas(c.contribution)}
      </span>
    ),
  }));
}
