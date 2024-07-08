import { useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRateWrapper from "./rate/DropListItemRateWrapper";
import DropsListItemChallengeBar from "./challenge/DropsListItemChallengeBar";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";
import { Drop } from "../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";
import DropListItemExternalLink from "./utils/DropListItemExternalLink";

export default function DropsListItem({
  drop,
  showFull = false,
  showExternalLink = true,
  isWaveDescriptionDrop = false,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly showExternalLink?: boolean;
  readonly isWaveDescriptionDrop?: boolean;
}) {
  const [quoteModePartId, setQuoteModePartId] = useState<number | null>(null);
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  const banner1 =
    drop.author.banner1_color ?? getRandomColorWithSeed(drop.author.handle);
  const banner2 =
    drop.author.banner2_color ?? getRandomColorWithSeed(drop.author.handle);

  const onQuote = (dropPartId: number) => {
    if (dropPartId === quoteModePartId) {
      setQuoteModePartId(null);
    } else {
      setQuoteModePartId(dropPartId);
    }
  };

  return (
    <div className="tw-relative tw-bg-iron-950">
      {isWaveDescriptionDrop ? (
        <div
          className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}
        ></div>
      ) : (
        <DropsListItemChallengeBar
          maxValue={100000}
          current={drop.rating}
          myRate={drop.context_profile_context?.rating ?? null}
        />
      )}

      <DropListItemCreateQuote
        drop={drop}
        quotedPartId={quoteModePartId}
        onSuccessfulQuote={() => setQuoteModePartId(null)}
      />
      <div className="tw-px-4 sm:tw-px-5 tw-pb-4 sm:tw-pb-5 tw-pt-2 sm:tw-pt-3">
        <div className="tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropListItemContent
              drop={drop}
              showFull={showFull}
              onQuote={onQuote}
            />
            {haveData && <DropListItemData drop={drop} />}
          </div>

          <div className="tw-flex tw-flex-col tw-items-center tw-min-h-full">
            {/* {showExternalLink && (
              <DropListItemExternalLink
                drop={drop}
                isWaveDescriptionDrop={isWaveDescriptionDrop}
              />
            )} */}
            <div className="tw-flex-grow tw-flex tw-flex-col tw-justify-center tw-items-center">
              <DropListItemRateWrapper drop={drop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
