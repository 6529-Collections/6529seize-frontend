import { memo } from "react";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import DropPart from "../../../view/part/DropPart";
import CreateDropStormViewPartQuote from "./CreateDropStormViewPartQuote";
import { ProfileMinWithoutSubs } from "../../../../../helpers/ProfileTypes";

interface CreateDropStormViewPartWaveProps {
  name: string;
  image: string | null;
  id: string | null;
}

interface CreateDropStormViewPartProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly part: CreateDropPart;
  readonly mentionedUsers: Array<Omit<MentionedUser, "current_handle">>;
  readonly referencedNfts: Array<ReferencedNft>;
  readonly createdAt: number;
  readonly wave: CreateDropStormViewPartWaveProps | null;
  readonly dropTitle: string | null;
  readonly partIndex: number;
  readonly removePart: (index: number) => void;
}

const CreateDropStormViewPart = memo(
  ({
    profile,
    part,
    mentionedUsers,
    referencedNfts,
    createdAt,
    wave,
    dropTitle,
    partIndex,
    removePart,
  }: CreateDropStormViewPartProps) => {
    const partMedias = part.media.map(media => ({
      mimeType: media.type,
      mediaSrc: URL.createObjectURL(media),
    }))

    const quotedDrop = part.quoted_drop;

    return (
      <div className="tw-py-2 tw-px-3 tw-my-2 tw-bg-iron-800 tw-rounded-lg">
        <div className="tw-flex tw-w-full tw-justify-between tw-gap-x-3">
          <div className="tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-flex-col tw-items-stretch">
              <DropPart
                profile={profile}
                mentionedUsers={mentionedUsers}
                referencedNfts={referencedNfts}
                partContent={part.content}
                partMedias={partMedias}
                createdAt={createdAt}
                smallMenuIsShown={false}
                wave={wave}
                dropTitle={dropTitle}
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
              className="tw-flex-shrink-0 tw-cursor-pointer tw-h-4 tw-w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
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
