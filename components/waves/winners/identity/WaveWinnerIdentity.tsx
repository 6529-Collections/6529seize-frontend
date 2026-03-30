import {
  WaveDropIdentity,
  type WaveDropIdentityVariant,
} from "@/components/waves/drops/identity/WaveDropIdentity";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WaveWinnerIdentityProps {
  readonly drop: {
    readonly id?: string | number | undefined;
    readonly wave: Pick<ApiWaveMin, "submission_type"> | null | undefined;
    readonly metadata: readonly ApiDropMetadataResponse[] | null | undefined;
  };
  readonly variant: WaveDropIdentityVariant;
  readonly className?: string | undefined;
}

export function WaveWinnerIdentity({
  drop,
  variant,
  className,
}: WaveWinnerIdentityProps) {
  return (
    <WaveDropIdentity
      drop={drop}
      variant={variant}
      className={className}
      testIdPrefix="wave-winner-identity"
    />
  );
}
