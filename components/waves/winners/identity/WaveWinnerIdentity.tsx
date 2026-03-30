import ParticipationIdentityProfileCard from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import Link from "next/link";
import {
  getWinnerIdentityFallbackValue,
  getWinnerIdentityProfile,
} from "./winnerIdentity.helpers";

type WaveWinnerIdentityVariant = "full" | "compact";

interface WaveWinnerIdentityProps {
  readonly drop: {
    readonly id?: string | number | undefined;
    readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
    readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
  };
  readonly variant: WaveWinnerIdentityVariant;
  readonly className?: string | undefined;
}

const getIdentityHref = (value: string) =>
  `/${encodeURIComponent(value.toLowerCase())}`;

function WinnerIdentityFallbackCard({
  fallbackValue,
}: {
  readonly fallbackValue: string;
}) {
  return (
    <div
      data-testid="wave-winner-identity-full"
      className="tw-rounded-xl tw-border tw-border-iron-800/60 tw-bg-iron-900/50 tw-p-4"
    >
      <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
        Identity
      </span>
      <p className="tw-mb-0 tw-mt-3 tw-break-all tw-text-sm tw-font-semibold tw-text-iron-50">
        {fallbackValue}
      </p>
    </div>
  );
}

export function WaveWinnerIdentity({
  drop,
  variant,
  className,
}: WaveWinnerIdentityProps) {
  const identityProfile = getWinnerIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const fallbackValue = identityProfile
    ? null
    : getWinnerIdentityFallbackValue({
        wave: drop.wave,
        metadata: drop.metadata,
      });

  if (!identityProfile && !fallbackValue) {
    return null;
  }

  if (variant === "full") {
    return (
      <div className={className}>
        {identityProfile ? (
          <div data-testid="wave-winner-identity-full">
            <ParticipationIdentityProfileCard
              profile={identityProfile}
              contextId={drop.id}
            />
          </div>
        ) : (
          <WinnerIdentityFallbackCard fallbackValue={fallbackValue!} />
        )}
      </div>
    );
  }

  const displayLabel =
    identityProfile?.handle ??
    identityProfile?.primary_address ??
    fallbackValue;

  if (!displayLabel) {
    return null;
  }

  return (
    <div className={className}>
      <div
        data-testid="wave-winner-identity-compact"
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-800/50 tw-bg-iron-900/40 tw-px-2.5 tw-py-2"
      >
        <span className="tw-flex-shrink-0 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
          Identity
        </span>
        {identityProfile ? (
          <Link
            href={getIdentityHref(displayLabel)}
            prefetch={false}
            onClick={(event) => event.stopPropagation()}
            className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300"
          >
            {displayLabel}
          </Link>
        ) : (
          <span className="tw-min-w-0 tw-break-all tw-text-sm tw-font-semibold tw-text-iron-100">
            {displayLabel}
          </span>
        )}
      </div>
    </div>
  );
}
