import React from "react";
import { CreateDropPart, ReferencedNft } from "@/entities/IDrop";
import { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import DropPartMarkdown from "../drops/view/part/DropPartMarkdown";

interface CreateDropStormPartProps {
  readonly partIndex: number;
  readonly part: CreateDropPart;
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly referencedNfts: ReferencedNft[];
  readonly onRemovePart: (partIndex: number) => void;
}

const CreateDropStormPart: React.FC<CreateDropStormPartProps> = ({
  partIndex,
  part,
  mentionedUsers,
  referencedNfts,
  onRemovePart,
}) => {
  return (
    <div className="tw-relative tw-group tw-flex tw-flex-col tw-gap-x-2">
      <span className="tw-leading-5 tw-text-iron-400 tw-font-normal tw-whitespace-nowrap tw-transition tw-duration-300 tw-ease-out tw-text-md">
        Part {partIndex + 1}
      </span>
      <div className="tw-pr-8">
        <DropPartMarkdown
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          partContent={part.content ?? ""}
          onQuoteClick={() => {}}
        />
      </div>
      <div className="tw-absolute tw-right-0 tw-top-1 group-hover:tw-block tw-hidden touch-visible tw-transition tw-duration-300 tw-ease-linear">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button
            type="button"
            onClick={() => onRemovePart(partIndex)}
            aria-label="Remove storm part"
            className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-900 tw-ring-iron-700 active:tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-text-error tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDropStormPart;
