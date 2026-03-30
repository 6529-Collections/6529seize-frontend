import ParticipationIdentityProfileCard from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import Link from "next/link";
import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
} from "../identityDisplay.helpers";

export type WaveDropIdentityVariant = "full" | "compact";

interface WaveDropIdentityProps {
  readonly drop: {
    readonly id?: string | number | undefined;
    readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
    readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
  };
  readonly variant: WaveDropIdentityVariant;
  readonly className?: string | undefined;
  readonly testIdPrefix?: string | undefined;
}

const getIdentityHref = (value: string) =>
  `/${encodeURIComponent(value.toLowerCase())}`;

function IdentityFallbackCard({
  fallbackValue,
  testId,
}: {
  readonly fallbackValue: string;
  readonly testId: string;
}) {
  return (
    <div
      data-testid={testId}
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

export function WaveDropIdentity({
  drop,
  variant,
  className,
  testIdPrefix = "wave-drop-identity",
}: WaveDropIdentityProps) {
  const identityProfile = getDropIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const fallbackValue = identityProfile
    ? null
    : getDropIdentityFallbackValue({
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
          <div data-testid={`${testIdPrefix}-full`}>
            <ParticipationIdentityProfileCard
              profile={identityProfile}
              contextId={drop.id}
            />
          </div>
        ) : (
          <IdentityFallbackCard
            fallbackValue={fallbackValue!}
            testId={`${testIdPrefix}-full`}
          />
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
        data-testid={`${testIdPrefix}-compact`}
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
