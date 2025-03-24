import React, { useEffect, useState } from "react";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import { cicToType, getTimeAgoShort } from "../../../helpers/Helpers";
import Link from "next/link";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import DropPartMarkdownWithPropLogger from "../../drops/view/part/DropPartMarkdownWithPropLogger";
import { Time } from "../../../helpers/time";

interface WaveDropQuoteProps {
  readonly drop: ApiDrop | null;
  readonly partId: number;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDropQuote: React.FC<WaveDropQuoteProps> = ({
  drop,
  partId,
  onQuoteClick,
}) => {
  const [quotedPart, setQuotedPart] = useState<ApiDropPart | null>(null);
  useEffect(() => {
    if (!drop) {
      return;
    }
    const part = drop.parts.find((part) => part.part_id === partId);
    if (!part) {
      return;
    }
    setQuotedPart(part);
  }, [drop]);

  const renderProfilePicture = () => {
    if (!drop) {
      return (
        <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-900 tw-animate-pulse"></div>
      );
    }

    if (drop.author.pfp) {
      return (
        <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden">
          <img
            src={drop.author.pfp}
            alt={`${drop.author.handle}'s profile picture`}
            className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-cover"
          />
        </div>
      );
    }

    return (
      <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-900"></div>
    );
  };

  const goToQuoteDrop = () => {
    if (drop?.wave.id && drop?.id) {
      onQuoteClick(drop);
    }
  };

  return (
    <div
      className="tw-mt-1 tw-bg-iron-950 tw-rounded-xl tw-px-3 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        goToQuoteDrop();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          goToQuoteDrop();
        }
      }}
      role="button"
      tabIndex={0}>
      <div className="tw-relative tw-group tw-w-full tw-flex tw-flex-col">
        <div className="tw-flex tw-gap-x-2">
          <div className="tw-h-6 tw-w-6 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-md">
            <div className="tw-rounded-md tw-h-full tw-w-full">
              {renderProfilePicture()}
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                {!!drop && (
                  <UserCICAndLevel
                    level={drop.author.level}
                    cicType={cicToType(drop?.author.cic)}
                    size={UserCICAndLevelSize.SMALL}
                  />
                )}

                <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  <Link
                    href={`/${drop?.author.handle}`}
                    className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
                    {drop?.author.handle}
                  </Link>
                </p>
              </div>

              {!!drop && (
                <>
                  <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                  <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                    {getTimeAgoShort(drop.created_at)}
                  </p>
                  <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                  <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                    {Time.millis(
                      drop.created_at
                    ).toIsoTimeStringWithoutSeconds()}
                  </p>
                </>
              )}
            </div>
            <div>
              <Link
                href={`/my-stream?wave=${drop?.wave.id}`}
                className="tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline">
                {drop?.wave.name}
              </Link>
            </div>
            <div className="tw-mt-0.5">
              <DropPartMarkdownWithPropLogger
                partContent={quotedPart?.content ?? ""}
                mentionedUsers={drop?.mentioned_users ?? []}
                referencedNfts={drop?.referenced_nfts ?? []}
                textSize="sm"
                onQuoteClick={onQuoteClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveDropQuote;
