"use client"

import React, { useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import {
  useUserArtSubmissions,
  useSubmissionDrops,
} from "@/hooks/useUserArtSubmissions";
import {
  SingleWaveDropVote,
  SingleWaveDropVoteSize,
} from "../drop/SingleWaveDropVote";
import { SubmissionPosition } from "./SubmissionPosition";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { formatNumberWithCommas } from "@/helpers/Helpers";

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
  const { submissions, isLoading } = useUserArtSubmissions(
    isOpen ? user : undefined
  );
  const { submissionsWithDrops, isLoading: dropsLoading } =
    useSubmissionDrops(submissions);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize expensive operations - must be before any conditional returns
  const formatDate = useMemo(
    () => (timestamp: number) => {
      const date = new Date(timestamp);
      const currentYear = new Date().getFullYear();
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== currentYear ? "numeric" : undefined,
      });
    },
    []
  );

  const handleDropClick = useCallback(
    (dropId: string) => {
      if (!searchParams) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("drop", dropId);
      router.push(`${pathname}?${params.toString()}`);
      onClose();
    },
    [searchParams, router, pathname, onClose]
  );

  const handleVoteSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_DROPS],
    });
  }, [queryClient]);

  if (!searchParams) {
    return null;
  }

  return (
    <div
      className={`tw-relative tw-z-[100] tw-p-6 ${
        isApp
          ? ""
          : "tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-max-h-[calc(75vh-120px)] sm:tw-max-h-[calc(90vh-160px)]"
      }`}
    >
        {(() => {
          if (isLoading || dropsLoading) {
            return (
              <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
                <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
                  <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-iron-400"></div>
                  <span className="tw-text-iron-400 tw-text-sm tw-animate-fade-in-out">
                    Loading submissions...
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
              {submissionsWithDrops.map((submission) => (
                <div
                  key={submission.id}
                  className="tw-flex tw-flex-col tw-h-full"
                >
                  <div
                    className="tw-group tw-relative tw-cursor-pointer tw-flex tw-flex-col tw-flex-1 tw-bg-iron-950/50 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-overflow-hidden desktop-hover:hover:tw-border-iron-700 tw-shadow-lg desktop-hover:hover:tw-shadow-xl tw-transition-all tw-duration-300 tw-ease-out tw-mb-3"
                    onClick={() => handleDropClick(submission.id)}
                  >
                    <div className="tw-aspect-square tw-relative tw-overflow-hidden tw-bg-iron-950/50">
                      <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
                        <MediaDisplay
                          media_url={submission.imageUrl}
                          media_mime_type={submission.mediaMimeType}
                          disableMediaInteraction={true}
                        />
                      </div>
                      <div className="tw-absolute tw-top-3 tw-right-3 tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300">
                        <div className="tw-w-8 tw-h-8 tw-bg-black/50 tw-backdrop-blur-sm tw-rounded-full tw-flex tw-items-center tw-justify-center">
                          <FontAwesomeIcon
                            icon={faEye}
                            className="tw-w-3.5 tw-h-3.5 tw-text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="tw-p-3 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-bg-iron-950/50 tw-flex tw-flex-col tw-flex-1 tw-justify-between">
                      <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                        <div className="tw-min-w-0 tw-flex-1 tw-mr-2">
                          {submission.title && (
                            <p className="tw-mb-0 tw-text-sm tw-font-bold tw-text-iron-100 tw-truncate tw-leading-tight">
                              {submission.title}
                            </p>
                          )}
                        </div>
                        {submission.drop && (
                          <SubmissionPosition drop={submission.drop} />
                        )}
                      </div>
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
                  </div>
                  {submission.drop && (
                    <SingleWaveDropVote
                      drop={submission.drop}
                      size={SingleWaveDropVoteSize.MINI}
                      onVoteSuccess={handleVoteSuccess}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })()}
    </div>
  );
};
