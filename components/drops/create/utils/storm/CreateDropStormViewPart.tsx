import { memo } from "react";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import DropPart from "../../../view/part/DropPart";
import CreateDropStormViewPartQuote from "./CreateDropStormViewPartQuote";
import { ProfileMin } from "../../../../../generated/models/ProfileMin";

const CreateDropStormViewPart = memo(
  ({
    profile,
    part,
    mentionedUsers,
    referencedNfts,
    createdAt,
    isDescriptionDrop,
    waveName,
    waveImage,
    dropTitle,
    waveId,
    partIndex,
    removePart,
  }: {
    readonly profile: ProfileMin;
    readonly part: CreateDropPart;
    readonly mentionedUsers: Array<Omit<MentionedUser, "current_handle">>;
    readonly referencedNfts: Array<ReferencedNft>;
    readonly createdAt: number;
    readonly isDescriptionDrop: boolean;
    readonly waveName: string;
    readonly waveImage: string | null;
    readonly dropTitle: string | null;
    readonly waveId: string | null;
    readonly partIndex: number;
    readonly removePart: (index: number) => void;
  }) => {
    const partMedia = part.media.length
      ? {
          mimeType: part.media[0].type,
          mediaSrc: URL.createObjectURL(part.media[0]),
        }
      : null;

    const quotedDrop = part.quoted_drop;

    return (
      <div className="tw-py-2">
        <div className="tw-flex tw-w-full tw-justify-between">
          <div className="tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-flex-col tw-items-stretch">
              <DropPart
                profile={profile}
                mentionedUsers={mentionedUsers}
                referencedNfts={referencedNfts}
                partContent={part.content}
                partMedia={partMedia}
                createdAt={createdAt}
                isFirstPart={partIndex === 0}
                isDescriptionDrop={isDescriptionDrop}
                waveName={waveName}
                dropTitle={dropTitle}
                waveImage={waveImage}
                waveId={waveId}
              />
              <div className="tw-w-2 tw-bg-iron-700"></div>
            </div>
            {quotedDrop && (
              <CreateDropStormViewPartQuote
                quotedDrop={quotedDrop}
                profile={profile}
              />
            )}
          </div>
          <div
            onClick={() => removePart(partIndex)}
            role="button"
            aria-label="Remove part"
            className="tw-flex-shrink-0 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-iron-800 tw-text-iron-300 hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-flex-shrink-0 tw-top-4 tw-cursor-pointer tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 7L7 17M7 7L17 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

CreateDropStormViewPart.displayName = "CreateDropStormViewPart";
export default CreateDropStormViewPart;
