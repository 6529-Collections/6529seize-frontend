import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

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
                      <h3 className="tw-text-md tw-font-medium tw-text-iron-50 tw-truncate">
                        {item.title}
                      </h3>
                      <span className="tw-text-xs tw-text-iron-400 tw-truncate">
                        @{item.author.handle}
                      </span>
                    </div>
                  </div>

                  {/* Vote controls */}
                  <div className="tw-flex tw-items-center tw-gap-x-3 tw-ml-auto">
                    {/* Vote stats moved here */}
                    <span className="tw-text-xs tw-text-iron-300 tw-whitespace-nowrap">
                      Total:{" "}
                      <span className="tw-font-medium tw-text-emerald-500">
                        {formatNumberWithCommas(item.current_votes)}
                      </span>
                      <span className="tw-text-iron-400 tw-ml-1">
                        / {item.max_votes}
                      </span>
                    </span>

                    <div className="tw-flex tw-items-center">
                      <span className="tw-text-xs tw-text-iron-300 tw-mr-2 tw-whitespace-nowrap">
                        My votes:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={item.max_votes}
                        value={votes[item.id]}
                        onChange={(e) =>
                          handleVoteChange(
                            item.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="tw-bg-iron-800 tw-border tw-border-iron-600 tw-rounded tw-py-1 tw-px-2 tw-w-12 tw-text-center tw-text-iron-50 tw-text-xs"
                      />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVote(item.id);
                      }}
                      className="tw-p-1.5 tw-rounded-full tw-bg-iron-800 hover:tw-bg-iron-700 tw-text-iron-400 hover:tw-text-red-400 tw-transition-colors"
                      title="Remove vote"
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </button>
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
