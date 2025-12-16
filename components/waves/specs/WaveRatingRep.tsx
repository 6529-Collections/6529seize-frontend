import { ApiWave } from "@/generated/models/ApiWave";
import Link from "next/link";

interface WaveRatingRepProps {
  readonly wave: ApiWave;
}

export default function WaveRatingRep({ wave }: WaveRatingRepProps) {
  return (
    <div className="tw-bg-iron-800 tw-rounded-xl tw-flex tw-flex-col tw-gap-y-3 tw-px-4 tw-py-3">
      <div className="tw-flex tw-flex-col">
        <span className="tw-font-medium tw-text-iron-400">Category:</span>
        <span className="tw-font-medium tw-text-iron-50">
          {wave.voting.credit_category}
        </span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        <span className="tw-font-medium tw-text-iron-400">Creditor:</span>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {wave.voting.creditor?.pfp ? (
            <img
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800"
              src={wave.voting.creditor.pfp}
              alt={wave.voting.creditor.handle ?? ""}
            />
          ) : (
            <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800" />
          )}
          {wave.voting.creditor?.handle && (
            <Link
              href={`/${wave.voting.creditor.handle}`}
              className="tw-no-underline tw-font-medium tw-text-iron-50 hover:tw-text-iron-300 tw-transition-colors"
            >
              {wave.voting.creditor.handle}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
