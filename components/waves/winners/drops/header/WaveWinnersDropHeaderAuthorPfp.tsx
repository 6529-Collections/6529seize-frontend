import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderAuthorPfpProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly size?: "sm" | "md";
}

export default function WaveWinnersDropHeaderAuthorPfp({
  winner,
  size = "md",
}: WaveWinnersDropHeaderAuthorPfpProps) {
  const sizeClasses = size === "sm" ? "tw-h-8 tw-w-8" : "tw-h-12 tw-w-12";
  return (
    <div
      className={`tw-relative tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-900 ${sizeClasses}`}
    >
      {winner.drop.author.pfp ? (
        <div className="tw-h-full tw-w-full tw-rounded-lg">
          <div className="tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-text-center">
              <img
                src={winner.drop.author.pfp}
                alt="Profile picture"
                className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10"></div>
      )}
    </div>
  );
}
