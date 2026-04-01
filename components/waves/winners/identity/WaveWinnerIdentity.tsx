import {
  WaveDropIdentity,
  type WaveDropIdentityVariant,
} from "@/components/waves/drops/identity/WaveDropIdentity";
import type { ParticipationIdentityProfileCardVariant } from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WaveWinnerIdentityProps {
  readonly drop: {
    readonly id?: string | number | undefined;
    readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
    readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
  };
  readonly variant: WaveDropIdentityVariant;
  readonly cardVariant?: ParticipationIdentityProfileCardVariant | undefined;
  readonly className?: string | undefined;
}

export function WaveWinnerIdentity({
  drop,
  variant,
  cardVariant,
  className,
}: WaveWinnerIdentityProps) {
  return (
    <WaveDropIdentity
      drop={drop}
      variant={variant}
      cardVariant={cardVariant}
      className={className}
      testIdPrefix="wave-winner-identity"
    />
  );
}
