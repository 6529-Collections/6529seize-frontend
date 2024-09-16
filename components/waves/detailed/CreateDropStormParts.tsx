import React from "react";

import DropPartMarkdown from "../../drops/view/part/DropPartMarkdown";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";
import WaveDetailedDropHeader from "./drops/WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./drops/WaveDetailedDropAuthorPfp";

interface CreateDropStormPartsProps {
  readonly parts: CreateDropPart[];
  readonly mentionedUsers: DropMentionedUser[];
  readonly referencedNfts: ReferencedNft[];
}

const CreateDropStormParts: React.FC<CreateDropStormPartsProps> = ({
  parts,
  mentionedUsers,
  referencedNfts,
}) => {
  return (
    <div className="tw-space-y-4 tw-pb-3">
      <div className="tw-bg-transparent tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-2 tw-transition-colors tw-duration-300">
        <div className="tw-flex tw-gap-x-3">
          <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
            <div className="tw-rounded-lg tw-h-full tw-w-full">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                  <img
                    src="#"
                    alt="Profile picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="tw-mt-1 tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                cic
                <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  <a
                    href="#"
                    className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                  >
                    user
                  </a>
                </p>
              </div>
            </div>

            <div className="tw-mt-4 tw-space-y-4">
              <div className="tw-relative tw-group tw-flex tw-flex-col tw-gap-x-2">
                <span className="tw-leading-5 tw-text-iron-400 tw-font-normal tw-whitespace-nowrap tw-transition tw-duration-300 tw-ease-out tw-text-md">
                  Part 1
                </span>
                <div className="tw-pr-8">
                  {parts.map((part, index) => (
                    <DropPartMarkdown
                      key={`drop-part-${index}-${
                        part.content?.substring(0, 10) || "empty"
                      }`}
                      mentionedUsers={mentionedUsers}
                      referencedNfts={referencedNfts}
                      partContent={part.content ?? ""}
                      onImageLoaded={() => {}}
                    />
                  ))}
                </div>
                <div className="tw-absolute tw-right-0 tw-top-4 group-hover:tw-block tw-hidden tw-transition tw-duration-300 tw-ease-linear">
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <button
                      type="button"
                      aria-label="Remove storm part"
                      className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-900 tw-ring-iron-700 hover:tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out"
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

              {/*   {parts.map((part, index) => (
                <DropPartMarkdown
                  key={`drop-part-${index}-${
                    part.content?.substring(0, 10) || "empty"
                  }`}
                  mentionedUsers={mentionedUsers}
                  referencedNfts={referencedNfts}
                  partContent={part.content ?? ""}
                  onImageLoaded={() => {}}
                />
              ))} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDropStormParts;
