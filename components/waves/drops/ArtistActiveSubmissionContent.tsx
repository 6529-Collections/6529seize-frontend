"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  useSubmissionDrops,
  useUserArtSubmissions,
} from "@/hooks/useUserArtSubmissions";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import {
  SingleWaveDropVote,
  SingleWaveDropVoteSize,
} from "../drop/SingleWaveDropVote";
import { AdditionalActionPromiseBadge } from "./AdditionalActionPromiseBadge";
import WinnerDropBadge from "./winner/WinnerDropBadge";

interface ArtistActiveSubmissionContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp?: boolean | undefined;
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
  const compact = useCompactMode();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");

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
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("drop", dropId);
      router.push(`${pathname}?${params.toString()}`);
      if (compact && isSmallScreen) {
        globalThis.window.dispatchEvent(
          new CustomEvent("single-drop:close-chat")
        );
      }
      onClose();
    },
    [searchParams, router, pathname, compact, isSmallScreen, onClose]
  );

  const handleVoteSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_DROPS],
    });
  }, [queryClient]);

  return (
    <div
      className={`tw-relative tw-z-[100] tw-px-6 tw-pb-6 tw-pt-4 ${
        isApp
          ? ""
          : "tw-max-h-[calc(75vh-120px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-max-h-[calc(90vh-160px)]"
      }`}
    >
      {(() => {
        if (isLoading || dropsLoading) {
          return (
            <div className="tw-flex tw-h-96 tw-items-center tw-justify-center">
              <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
                <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-400"></div>
                <span className="tw-animate-fade-in-out tw-text-sm tw-text-iron-400">
                  Loading submissions...
                </span>
              </div>
            </div>
          );
        }

        return (
          <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
            {submissionsWithDrops.map((submission) => (
              <div
                key={submission.id}
                // Keep pending vote announcements accessible without a temporary card footer.
                className="tw-flex tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/70 tw-bg-iron-950/50 tw-shadow-sm [&>.is-mini:has(>[role=status])>fieldset]:tw-hidden [&>.is-mini:has(>[role=status])]:tw-contents [&>.is-mini>[role=status]]:tw-sr-only [&>.is-mini]:tw-rounded-none [&>.is-mini]:tw-border-x-0 [&>.is-mini]:tw-border-b-0 [&>.is-mini]:tw-border-iron-800/60 [&>[role=status]]:tw-sr-only"
              >
                <div
                  className="tw-group tw-relative tw-flex tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-bg-iron-950/50 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-900/50"
                  onClick={() => handleDropClick(submission.id)}
                >
                  <div className="tw-relative tw-aspect-square tw-overflow-hidden tw-bg-iron-950/50">
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
                      <MediaDisplay
                        media_url={submission.imageUrl}
                        media_mime_type={submission.mediaMimeType}
                        disableMediaInteraction={true}
                      />
                    </div>
                    <div className="tw-absolute tw-right-3 tw-top-3 tw-opacity-0 tw-transition-opacity tw-duration-300 desktop-hover:group-hover:tw-opacity-100">
                      <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/50 tw-backdrop-blur-sm">
                        <FontAwesomeIcon
                          icon={faEye}
                          className="tw-h-3.5 tw-w-3.5 tw-text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="tw-flex tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-bg-iron-950/50 tw-p-3">
                    <div className="tw-w-full tw-min-w-0">
                      <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2">
                        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-1.5">
                          <MediaTypeBadge
                            mimeType={submission.mediaMimeType}
                            dropId={submission.id}
                            size="sm"
                            iconClassName="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                            tooltipPortal
                            tooltipZIndex={1000002}
                          />
                          {submission.drop?.is_additional_action_promised ===
                            true && (
                            <AdditionalActionPromiseBadge
                              tooltipZIndex={1000002}
                            />
                          )}
                        </div>
                        {submission.drop && Boolean(submission.drop.rank) && (
                          <div className="tw-shrink-0">
                            <WinnerDropBadge
                              rank={submission.drop.rank}
                              decisionTime={null}
                            />
                          </div>
                        )}
                      </div>
                      {submission.title && (
                        <p className="tw-mb-0 tw-mt-2 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
                          {submission.title}
                        </p>
                      )}
                    </div>
                    {submission.drop && (
                      <div className="tw-w-full tw-min-w-0">
                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5">
                          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-gap-y-1 tw-text-sm">
                            <span
                              className={`tw-font-semibold tw-tabular-nums ${
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
                              numberFont="sans"
                              numberWeight="semibold"
                              numberTracking="normal"
                              tooltipPortal
                              tooltipZIndex={1000002}
                            />
                          </div>
                          <div className="tw-whitespace-nowrap tw-text-sm tw-text-iron-500">
                            <span className="tw-font-normal">TDH total</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="tw-flex tw-w-full tw-items-center tw-gap-1.5 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500">
                      <CalendarDaysIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0" />
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
