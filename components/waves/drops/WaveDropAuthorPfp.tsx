import React, { useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ArtistSubmissionBadge } from "./ArtistSubmissionBadge";
import { ArtistSubmissionPreviewModal } from "./ArtistSubmissionPreviewModal";
import { Tooltip } from "react-tooltip";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get submission count from user profile data (no API call needed)
  const submissionCount = drop.author.active_main_stage_submission_ids?.length || 0;

  const handlePfpClick = () => {
    if (submissionCount > 0) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const hasSubmissions = submissionCount > 0;
  const tooltipId = `pfp-art-${drop.id}`;

  return (
    <>
      <div
        className={`tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg tw-group/pfp tw-transition-all tw-duration-300 ${
          hasSubmissions ? "tw-cursor-pointer" : ""
        }`}
        onClick={handlePfpClick}
        data-tooltip-id={hasSubmissions ? tooltipId : undefined}
      >
        {drop.author.pfp ? (
          <div className="tw-rounded-lg tw-h-full tw-w-full tw-transition-all tw-duration-300 desktop-hover:group-hover/pfp:tw-scale-[1.02]">
            <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-white/10 desktop-hover:group-hover/pfp:tw-ring-white/20 tw-transition-all tw-duration-300 tw-shadow-sm desktop-hover:group-hover/pfp:tw-shadow-md">
              <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden tw-relative">
                <img
                  src={drop.author.pfp}
                  alt="Profile picture"
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain tw-transition-all tw-duration-300"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 desktop-hover:group-hover/pfp:tw-ring-white/20 tw-rounded-lg tw-transition-all tw-duration-300"></div>
        )}

        {/* Artist Submission Badge */}
        {hasSubmissions && (
          <ArtistSubmissionBadge
            submissionCount={submissionCount}
            onBadgeClick={handlePfpClick}
          />
        )}
      </div>

      {/* Artist Submission Preview Modal */}
      <ArtistSubmissionPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={drop.author}
      />

      {/* Tooltip for entire pfp area */}
      {hasSubmissions && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          content={`View ${submissionCount} art submission${
            submissionCount === 1 ? "" : "s"
          }`}
          delayShow={300}
          opacity={1}
          style={{
            backgroundColor: "#37373E",
            color: "white",
            padding: "6px 12px",
            fontSize: "12px",
            zIndex: 10,
          }}
        />
      )}
    </>
  );
};

export default WaveDropAuthorPfp;
