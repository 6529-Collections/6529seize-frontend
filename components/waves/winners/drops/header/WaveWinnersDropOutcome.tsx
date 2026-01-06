import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";

interface WaveWinnersDropOutcomeProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropOutcome({
  winner,
}: WaveWinnersDropOutcomeProps) {
  // Transform awards into outcome format
  const nicOutcomes = winner.awards
    .filter(
      (award) =>
        award.credit === ApiWaveOutcomeCredit.Cic &&
        award.amount &&
        award.amount > 0
    )
    .map((award) => ({
      type: ApiWaveOutcomeCredit.Cic as const,
      value: award.amount ?? 0,
    }));

  const repOutcomes = winner.awards
    .filter(
      (award) =>
        award.credit === ApiWaveOutcomeCredit.Rep &&
        award.amount &&
        award.amount > 0
    )
    .map((award) => ({
      type: ApiWaveOutcomeCredit.Rep as const,
      value: award.amount ?? 0,
      category: award.rep_category ?? "",
    }));

  const manualOutcomes = winner.awards
    .filter(
      (award) => award.type === ApiWaveOutcomeType.Manual && award.description
    )
    .map((award) => ({
      type: ApiWaveOutcomeType.Manual as const,
      description: award.description ?? "",
    }));

  const haveOutcomes =
    nicOutcomes.length > 0 ||
    repOutcomes.length > 0 ||
    manualOutcomes.length > 0;

  if (!haveOutcomes) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-start tw-gap-2">
      <span className="tw-text-iron-500 tw-text-sm tw-font-medium">
        Outcome:
      </span>
      <div className="tw-flex tw-flex-wrap tw-gap-1.5">
        {nicOutcomes.map((nicOutcome) => (
          <span
            key={`NIC-${nicOutcome.value}`}
            className="tw-flex tw-items-center tw-gap-1.5"
          >
            <FontAwesomeIcon
              icon={faAddressCard}
              className="tw-size-3.5 tw-text-blue-300/70 tw-mt-1"
            />
            <span className="tw-text-sm tw-font-normal tw-text-iron-50">
              NIC
            </span>
            <span className="tw-text-sm tw-font-normal tw-text-blue-200/90">
              {formatNumberWithCommas(nicOutcome.value)}
            </span>
          </span>
        ))}

        {repOutcomes.map((repOutcome) => (
          <span
            key={`REP-${repOutcome.category}-${repOutcome.value}`}
            className="tw-flex tw-gap-1.5"
          >
            <FontAwesomeIcon
              icon={faStar}
              className="tw-size-3.5 tw-text-purple-300/70 tw-mt-1"
            />
            <span className="tw-text-sm tw-font-normal tw-text-iron-50">
              Rep
            </span>
            <span className="tw-text-sm tw-font-normal tw-text-purple-200/90">
              {formatNumberWithCommas(repOutcome.value)}
            </span>
            {repOutcome.category && (
              <>
                <span className="tw-size-[2px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-400/70"></span>
                <span className="tw-text-sm tw-font-normal tw-text-purple-200/90">
                  {repOutcome.category}
                </span>
              </>
            )}
          </span>
        ))}

        {manualOutcomes.map((outcome) => (
          <span
            key={`MANUAL-${outcome.description}`}
            className="tw-flex tw-gap-1.5"
          >
            <FontAwesomeIcon
              icon={faAward}
              className="tw-size-3.5 tw-text-amber-300/70 tw-mt-1"
            />
            <span className="tw-text-sm tw-font-normal tw-text-amber-100/90">
              {outcome.description}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
