import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";

interface MyStreamWaveMyVotesProps {
  readonly wave: ApiWave;
  readonly onDropClick?: (drop: ExtendedDrop) => void;
}

// Temporary mock data for demonstration, replace with actual data fetching
const MOCK_VOTED_ITEMS = [
  {
    id: "1",
    title: "Ethereal Visions",
    author: {
      handle: "artist_one",
      display_name: "Artist One",
    },
    current_votes: 18,
    max_votes: 24,
    my_votes: 3,
    media: {
      url: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7",
      mime_type: "image/jpeg",
    },
  },
  {
    id: "2",
    title: "Digital Renaissance",
    author: {
      handle: "creator_two",
      display_name: "Creator Two",
    },
    current_votes: 21,
    max_votes: 24,
    my_votes: 5,
    media: {
      url: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead",
      mime_type: "image/jpeg",
    },
  },
];

const MyStreamWaveMyVotes: React.FC<MyStreamWaveMyVotesProps> = ({
  wave,
  onDropClick,
}) => {
  // State to track votes for each submission
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    return MOCK_VOTED_ITEMS.reduce((acc, item) => {
      acc[item.id] = item.my_votes;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleVoteChange = (id: string, newValue: number) => {
    setVotes((prev) => ({
      ...prev,
      [id]: newValue,
    }));
  };

  const handleDeleteVote = (id: string) => {
    // In a real implementation, this would call an API to delete the vote
    console.log(`Deleting vote for submission ${id}`);
    // For the mock UI, just set votes to 0
    setVotes((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  return (
    <div className="tw-h-full tw-overflow-y-auto tw-py-4">
      <div className="tw-space-y-4">
        {MOCK_VOTED_ITEMS.length === 0 ? (
          <div className="tw-bg-iron-900 tw-rounded-lg tw-p-4">
            <p className="tw-text-iron-300">
              You haven't voted on any submissions in this wave yet.
            </p>
          </div>
        ) : (
          <div className="tw-space-y-2">
            {MOCK_VOTED_ITEMS.map((item) => (
              <div
                key={item.id}
                className="tw-bg-iron-900 tw-rounded-lg tw-p-3 tw-border tw-border-iron-700 hover:tw-border-iron-600 tw-transition-colors tw-cursor-pointer"
                onClick={() => onDropClick && onDropClick({} as ExtendedDrop)}
              >
                <div className="tw-flex tw-items-center">
                  {/* Artwork thumbnail */}
                  <div className="tw-w-14 tw-h-14 tw-flex-shrink-0 tw-mr-3 tw-bg-iron-800/30 tw-rounded-md tw-overflow-hidden">
                    <DropListItemContentMedia
                      media_mime_type={item.media.mime_type}
                      media_url={item.media.url}
                    />
                  </div>

                  {/* Title and author */}
                  <div className="tw-flex-grow tw-min-w-0">
                    <div className="tw-flex tw-flex-col">
                      <h3 className="tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
                        {item.title}
                      </h3>
                      <span className="tw-text-sm tw-text-iron-400 tw-truncate">
                        @{item.author.handle}
                      </span>
                    </div>
                  </div>

                  {/* Vote controls */}
                  <div className="tw-flex tw-items-center tw-gap-x-4 tw-ml-auto">
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
                      <div className="tw-flex tw-items-center tw-gap-x-1.5">
                        <span className="tw-text-sm tw-font-semibold tw-text-emerald-500">
                          123
                        </span>

                        <span
                          className="tw-text-emerald-400 tw-bg-emerald-950/80 tw-text-xs tw-font-medium tw-animate-pulse tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1"
                          style={{
                            animationDuration: "2s",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="tw-flex-shrink-0 tw-size-3"
                          />
                          <span>321</span>
                        </span>
                      </div>

                      <div className="tw-flex tw-items-center tw-gap-x-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.25"
                          stroke="currentColor"
                          className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                          />
                        </svg>
                        <span className="tw-text-sm tw-font-medium tw-text-iron-200">
                          123
                        </span>
                      </div>
                    </div>

                    <div className="tw-flex tw-items-center">
                      <span className="tw-text-sm tw-text-iron-300 tw-mr-3 tw-whitespace-nowrap">
                        My votes
                      </span>
                      <div className="tw-flex tw-items-center tw-gap-x-3">
                        <div className="tw-relative tw-w-full xl:tw-max-w-24">
                          <input
                            type="text"
                            pattern="-?[0-9]*"
                            inputMode="numeric"
                            className="tw-w-full tw-px-3 tw-h-8 tw-bg-iron-900 tw-rounded-lg tw-text-iron-50 tw-placeholder-iron-400 tw-text-base tw-font-medium tw-border-0 tw-ring-1 tw-ring-iron-700 focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-primary-400 tw-outline-none tw-transition-all desktop-hover:hover:tw-bg-iron-950/60 focus:tw-bg-iron-950/80"
                          />
                          <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400 tw-pointer-events-none">
                            TDH
                          </div>
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-px-3 tw-h-8 tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-600 tw-text-iron-300 desktop-hover:hover:tw-text-iron-100 tw-transition-all tw-duration-300 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 active:tw-scale-95 tw-text-sm tw-font-medium"
                            aria-label="Save vote changes"
                          >
                            Vote
                          </button>

                          {/* Delete vote button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVote(item.id);
                            }}
                            className="tw-border-0 tw-group tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 desktop-hover:hover:tw-ring-red-400/50 tw-text-red-400 desktop-hover:hover:tw-text-red-300 tw-transition-all tw-duration-300 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 active:tw-scale-95"
                            aria-label="Delete vote"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="tw-size-4 tw-flex-shrink-0 tw-text-iron-300 desktop-hover:group-hover:tw-text-red tw-transition-all tw-duration-300 desktop-hover:hover:tw-bg-iron-800"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStreamWaveMyVotes;
