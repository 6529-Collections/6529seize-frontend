import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";
import { useEffect, useState } from "react";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropPartWrapper from "../../part/DropPartWrapper";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

export default function DropListItemContent({
  drop,
  showFull = false,
  onQuote,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly onQuote: (dropPartId: number) => void;
}) {
  const [isFullMode, setIsFullMode] = useState(showFull);
  const getParts = () => {
    if (!drop.parts.length) {
      return [];
    }
    if (!isFullMode) {
      return [drop.parts[0]];
    }
    return drop.parts;
  };
  const [parts, setParts] = useState(getParts());
  useEffect(() => setParts(getParts()), [drop.parts, isFullMode]);

  const partsCount = drop.parts.length;
  const isStorm = partsCount > 1;

  const getShowStormExpandButton = () => {
    if (!isStorm) {
      return false;
    }
    if (isFullMode) {
      return false;
    }
    return true;
  };
  const [showStormExpandButton, setShowStormExpandButton] = useState(
    getShowStormExpandButton()
  );
  useEffect(
    () => setShowStormExpandButton(getShowStormExpandButton()),
    [isStorm, isFullMode]
  );

  return (
    <CommonAnimationHeight>
      <div className="tw-space-y-2 tw-h-full">
        {parts.map((part, index) => (
          <DropPartWrapper
            key={`drop-${drop.id}-part-${index}`}
            dropPart={part}
            drop={drop}
            onQuote={onQuote}
          >
            <DropPart
              mentionedUsers={drop.mentioned_users}
              referencedNfts={drop.referenced_nfts}
              partContent={part.content ?? null}
              partMedia={
                part.media.length
                  ? {
                      mimeType: part.media[0].mime_type,
                      mediaSrc: part.media[0].url,
                    }
                  : null
              }
              showFull={isFullMode}
            />
            {showStormExpandButton && index === 0 && (
              <button
                type="button"
                className="tw-mt-2 tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-py-1.5 tw-text-iron-300 hover:tw-text-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-600 hover:tw-ring-primary-400 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                onClick={() => setIsFullMode(true)}
              >
                <svg
                  className="tw-flex-shrink-0 tw-w-4 tw-h-4 tw-mr-1.5"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.2495 2H8.49395C8.31447 2 8.22473 2 8.14551 2.02733C8.07544 2.05149 8.01163 2.09093 7.95868 2.14279C7.89881 2.20143 7.85868 2.2817 7.77841 2.44223L3.57841 10.8422C3.38673 11.2256 3.29089 11.4173 3.31391 11.5731C3.33401 11.7091 3.40927 11.8309 3.52197 11.9097C3.65104 12 3.86534 12 4.29395 12H10.4995L7.49953 22L19.6926 9.35531C20.104 8.9287 20.3097 8.7154 20.3217 8.53288C20.3321 8.37446 20.2667 8.22049 20.1454 8.11803C20.0057 8 19.7094 8 19.1167 8H11.9995L14.2495 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Show Storm ({partsCount})</span>
              </button>
            )}
          </DropPartWrapper>
        ))}
      </div>
    </CommonAnimationHeight>
  );
}
