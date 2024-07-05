import { memo } from "react";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import DropPart from "../../../view/part/DropPart";
import CreateDropStormViewPartQuote from "./CreateDropStormViewPartQuote";

const CreateDropStormViewPart = memo(
  ({
    part,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly part: CreateDropPart;
    readonly mentionedUsers: Array<Omit<MentionedUser, "current_handle">>;
    readonly referencedNfts: Array<ReferencedNft>;
  }) => {
    const partMedia = part.media.length
      ? {
          mimeType: part.media[0].type,
          mediaSrc: URL.createObjectURL(part.media[0]),
        }
      : null;

    const quotedDrop = part.quoted_drop;

    return (
      <div className="tw-py-3">
        <div className="tw-flex tw-w-full tw-justify-between">
          <DropPart
            mentionedUsers={mentionedUsers}
            referencedNfts={referencedNfts}
            partContent={part.content}
            partMedia={partMedia}
          />
          {quotedDrop && (
            <CreateDropStormViewPartQuote quotedDrop={quotedDrop} />
          )}
          <div
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
