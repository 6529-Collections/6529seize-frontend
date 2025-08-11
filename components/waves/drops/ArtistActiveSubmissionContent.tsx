import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faEye } from "@fortawesome/free-solid-svg-icons";
import { CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import MediaDisplay from "../../drops/view/item/content/media/MediaDisplay";
import {
  useUserArtSubmissions,
  useSubmissionDrops,
} from "../../../hooks/useUserArtSubmissions";
import {
  SingleWaveDropVote,
  SingleWaveDropVoteSize,
} from "../drop/SingleWaveDropVote";
import { SubmissionPosition } from "./SubmissionPosition";
import { ProfileWinnerRing } from "./ProfileWinnerRing";
import { ProfileWinnerBadge } from "./ProfileWinnerBadge";
import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { formatNumberWithCommas } from "../../../helpers/Helpers";

interface ArtistActiveSubmissionContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp?: boolean;
}

export const ArtistActiveSubmissionContent: React.FC<
  ArtistActiveSubmissionContentProps
> = ({ user, isOpen, onClose, isApp = false }) => {
  const queryClient = useQueryClient();
  const { submissions, isLoading, error } = useUserArtSubmissions(
    isOpen ? user : undefined
  );
  const { submissionsWithDrops, isLoading: dropsLoading } =
    useSubmissionDrops(submissions);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if user has any main stage winner drop IDs
  const hasFirstPlaceWins =
    user.winner_main_stage_drop_ids &&
    user.winner_main_stage_drop_ids.length > 0;

  if (!searchParams) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const handleDropClick = (dropId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("drop", dropId);
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };

  return (
    <>
      {/* Content */}
      <div
        className={`tw-relative tw-z-[100] tw-p-6 ${
          isApp
            ? ""
            : "tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-max-h-[calc(75vh-120px)] sm:tw-max-h-[calc(80vh-120px)]"
        }`}
      >
        {(() => {
          if (isLoading || dropsLoading) {
            return (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                <div className="tw-text-iron-400">Loading submissions...</div>
              </div>
            );
          }

          if (error) {
            return (
              <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-gap-4">
                <div className="tw-text-red-400 tw-text-center">
                  Failed to load submissions
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="tw-px-4 tw-py-2 tw-bg-iron-700 tw-text-iron-200 tw-rounded-md tw-transition-colors desktop-hover:hover:tw-bg-iron-600"
                >
                  Try Again
                </button>
              </div>
            );
          }

          return (
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
              {submissionsWithDrops.map((submission, index) => (
                <div
                  key={submission.id}
                  className="tw-flex tw-flex-col tw-h-full"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="tw-group tw-relative tw-cursor-pointer tw-flex tw-flex-col tw-flex-1 tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-ring-1 tw-px-0.5 tw-pt-0.5 tw-ring-inset tw-ring-iron-900 desktop-hover:hover:tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-out tw-mb-3"
                    onClick={() => handleDropClick(submission.id)}
                  >
                    {/* Image container */}
                    <div className="tw-w-full tw-max-w-full tw-relative">
                      <div className="tw-h-[250px] min-[1200px]:tw-h-[18.75rem] tw-text-center tw-flex tw-items-center tw-justify-center">
                        <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
                          <MediaDisplay
                            media_url={submission.imageUrl}
                            media_mime_type={submission.mediaMimeType}
                            disableMediaInteraction={true}
                          />
                        </div>

                        {/* View indicator */}
                        <div className="tw-absolute tw-top-3 tw-right-3 tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300">
                          <div className="tw-w-8 tw-h-8 tw-bg-black/50 tw-backdrop-blur-sm tw-rounded-full tw-flex tw-items-center tw-justify-center">
                            <FontAwesomeIcon
                              icon={faEye}
                              className="tw-w-3.5 tw-h-3.5 tw-text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="tw-p-4 tw-flex tw-flex-col tw-flex-1 tw-justify-between">
                      {submission.drop && (
                        <div className="tw-mb-3">
                          <SubmissionPosition drop={submission.drop} />
                        </div>
                      )}

                      <div className="tw-flex-1">
                        {submission.title && (
                          <p className="tw-font-semibold tw-text-iron-100 tw-text-md tw-mb-2">
                            {submission.title}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      {submission.drop && (
                        <div className="tw-mb-3">
                          <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-flex-wrap">
                            <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm">
                              <span
                                className={`tw-font-medium ${
                                  submission.drop.rating >= 0
                                    ? "tw-text-iron-300"
                                    : "tw-text-iron-400"
                                }`}
                              >
                                {formatNumberWithCommas(submission.drop.rating)}
                              </span>
                              <DropVoteProgressing
                                current={submission.drop.rating}
                                projected={submission.drop.rating_prediction}
                                subtle={true}
                              />
                            </div>
                            <div className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
                              <span className="tw-font-medium">TDH total</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500 tw-mt-auto">
                        <CalendarDaysIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                        <span>{formatDate(submission.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Voting Interface - Outside the clickable card */}
                  {submission.drop && (
                    <SingleWaveDropVote
                      drop={submission.drop}
                      size={SingleWaveDropVoteSize.MINI}
                      onVoteSuccess={() => {
                        // Invalidate queries to refresh drop data after successful vote
                        queryClient.invalidateQueries({
                          queryKey: [QueryKey.DROP],
                        });
                        queryClient.invalidateQueries({
                          queryKey: [QueryKey.PROFILE_DROPS],
                        });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </>
  );
};
