import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WaveDropMetaRow } from "./WaveDropMetaRow";
import { WaveDropVoteSummary } from "./WaveDropVoteSummary";
import MainStageMemeCardLink, {
  isValidMemeCardId,
} from "@/components/memes/drops/MainStageMemeCardLink";

interface MemesDropSummarySectionProps {
  readonly drop: ExtendedDrop;
  readonly title: string;
  readonly description: string;
  readonly artworkMimeType?: string | undefined;
  readonly isWinner: boolean;
  readonly isVotingEnded: boolean;
  readonly canShowVote: boolean;
  readonly manualOutcomes: string[];
  readonly nicTotal: number;
  readonly repTotal: number;
  readonly onVoteClick: () => void;
}

export function MemesDropSummarySection({
  drop,
  title,
  description,
  artworkMimeType,
  isWinner,
  isVotingEnded,
  canShowVote,
  manualOutcomes,
  nicTotal,
  repTotal,
  onVoteClick,
}: MemesDropSummarySectionProps) {
  const memeCardId = drop.submission_context?.meme_card_id;
  const hasMemeCard = isValidMemeCardId(memeCardId);

  return (
    <div className="tw-mt-4 tw-px-4 sm:tw-px-6 md:tw-mt-6 xl:tw-px-20">
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
        <div className="tw-mb-8 tw-flex tw-justify-center">
          <WaveDropVoteSummary
            drop={drop}
            isWinner={isWinner}
            isVotingEnded={isVotingEnded}
            canShowVote={canShowVote}
            onVoteClick={onVoteClick}
          />
        </div>

        <div className="tw-mb-6">
          <h1 className="tw-mb-4 tw-text-lg tw-font-bold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            {title}
          </h1>
          {description && (
            <p className="tw-mb-0 tw-text-sm tw-text-white/60 lg:tw-text-md">
              {description}
            </p>
          )}
        </div>

        <WaveDropMetaRow
          drop={drop}
          isWinner={isWinner}
          mimeType={artworkMimeType}
        >
          {drop.is_additional_action_promised === true && (
            <>
              <span className="tw-text-white/40">·</span>
              <AdditionalActionPromiseBadge />
            </>
          )}
          {!hasMemeCard && manualOutcomes.length > 0 && (
            <>
              <span className="tw-text-white/40">·</span>
              {manualOutcomes.map((outcome) => (
                <span key={outcome} className="tw-text-sm tw-text-amber-400/70">
                  {outcome}
                </span>
              ))}
            </>
          )}
          {!!nicTotal && (
            <>
              <span className="tw-text-white/40">·</span>
              <FontAwesomeIcon
                icon={faAddressCard}
                className="tw-h-4 tw-w-4 tw-text-white/40"
              />
              <span className="tw-text-sm tw-text-white/60">
                {nicTotal} NIC
              </span>
            </>
          )}
          {!!repTotal && (
            <>
              <span className="tw-text-white/40">·</span>
              <FontAwesomeIcon
                icon={faStar}
                className="tw-h-4 tw-w-4 tw-text-white/40"
              />
              <span className="tw-text-sm tw-text-white/60">
                {repTotal} Rep
              </span>
            </>
          )}
        </WaveDropMetaRow>

        {hasMemeCard && (
          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
            {manualOutcomes.map((outcome) => (
              <span
                key={outcome}
                className="tw-text-base tw-font-medium tw-text-amber-400/80"
              >
                {outcome}
              </span>
            ))}
            <MainStageMemeCardLink
              memeCardId={memeCardId}
              variant="prominent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
