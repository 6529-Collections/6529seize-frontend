import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import WaveRatingCardSetTdh from "./WaveRatingCardSetTdh";
import WaveRatingRep from "./WaveRatingRep";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Xtdh]: "XTDH",
  [ApiWaveCreditType.TdhPlusXtdh]: "TDH + XTDH",
  [ApiWaveCreditType.Rep]: "REP",
  [ApiWaveCreditType.CardSetTdh]: "Card Set TDH",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveRating({ wave }: WaveRatingProps) {
  const creditType = wave.voting.credit_type;

  if (creditType === ApiWaveCreditType.CardSetTdh) {
    return <WaveRatingCardSetTdh creditNfts={wave.voting.credit_nfts} />;
  }

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-items-end tw-gap-2 tw-text-sm">
      <span className="tw-self-end tw-font-medium tw-text-iron-50">
        {CREDIT_TYPE_LABELS[creditType]}
      </span>
      {creditType === ApiWaveCreditType.Rep && <WaveRatingRep wave={wave} />}
    </div>
  );
}
