import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPalette, faEye } from "@fortawesome/free-solid-svg-icons";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import MediaDisplay from "../../drops/view/item/content/media/MediaDisplay";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import { useUserArtSubmissions } from "../../../hooks/useUserArtSubmissions";
import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";

interface ArtistSubmission {
  id: string;
  imageUrl: string;
  mediaMimeType: string;
  title?: string;
  createdAt: number;
}

interface ArtistSubmissionPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
}

export const ArtistSubmissionPreviewModal: React.FC<
  ArtistSubmissionPreviewModalProps
> = ({ isOpen, onClose, user }) => {
  
  // Fetch submissions only when modal is open
  const { submissions, isLoading } = useUserArtSubmissions(isOpen ? user : undefined);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;
  const { isApp } = useDeviceInfo();

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

  // Different animations for mobile (slide up) vs desktop (scale/fade)
  const modalVariants = {
    initial: isApp
      ? { y: "100%", opacity: 1 }
      : { opacity: 0, scale: 0.95, y: 20 },
    animate: isApp ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
    exit: isApp
      ? { y: "100%", opacity: 1 }
      : { opacity: 0, scale: 0.95, y: 20 },
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="tw-cursor-default tw-relative tw-z-[100]">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-z-[100]"></div>

        <div className="tw-fixed tw-inset-0 tw-z-[100] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
          <div
            className={`tw-flex tw-min-h-full ${
              isApp
                ? "tw-items-end"
                : "tw-items-center tw-justify-center tw-p-4"
            }`}
          >
            <motion.div
              initial={modalVariants.initial}
              animate={modalVariants.animate}
              exit={modalVariants.exit}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`tw-relative tw-w-full ${
                isApp
                  ? "tw-max-h-[85vh] tw-rounded-t-2xl"
                  : "tw-max-w-4xl tw-max-h-[90vh] tw-rounded-xl"
              } tw-bg-iron-950 tw-border tw-border-iron-800 tw-overflow-hidden tw-shadow-2xl tw-shadow-black/25`}
            >
              {/* Mobile drag handle */}
              {isApp && (
                <div className="tw-w-full tw-py-3 tw-flex tw-justify-center">
                  <div className="tw-w-12 tw-h-1 tw-bg-iron-600 tw-rounded-full"></div>
                </div>
              )}

              {/* Header */}
              <div
                className={`tw-relative tw-z-[100] tw-flex tw-justify-between ${
                  isApp ? "tw-px-6 tw-pb-6" : "tw-p-6"
                } tw-border-b tw-border-iron-800/60 tw-border-solid tw-border-t-0 tw-border-x-0`}
              >
                <div className="tw-flex-1">
                  <div className="tw-flex sm:tw-flex-row tw-flex-col sm:tw-items-center sm:tw-gap-4 tw-gap-3">
                    <div className="tw-relative">
                      <div className="tw-h-12 tw-w-12 tw-bg-iron-900 tw-rounded-lg tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-shadow-lg">
                        {user.pfp ? (
                          <img
                            src={user.pfp}
                            alt="Profile"
                            className="tw-w-full tw-h-full tw-object-contain tw-bg-transparent"
                          />
                        ) : (
                          <div className="tw-w-full tw-h-full tw-bg-iron-900 tw-flex tw-items-center tw-justify-center">
                            <FontAwesomeIcon
                              icon={faPalette}
                              className="tw-w-5 tw-h-5 tw-text-iron-600 tw-flex-shrink-0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="tw-text-left">
                      <div className="tw-text-xl sm:tw-text-3xl tw-font-bold tw-text-iron-100 tw-mb-1">
                        {user.handle || "Unknown Artist"}'s Submissions
                      </div>
                      <div className="tw-flex tw-items-center tw-justify-start tw-gap-2 tw-text-sm tw-text-iron-400">
                        <span>
                          {submissions.length} artwork
                          {submissions.length === 1 ? "" : "s"}
                        </span>
                        <span className="tw-w-1 tw-h-1 tw-bg-iron-600 tw-rounded-full"></span>
                        <span>The Memes Collection</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="tw-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-lg tw-text-iron-400 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800/50 tw-transition-all tw-duration-300 tw-border tw-border-solid tw-border-iron-800/50 desktop-hover:hover:tw-border-iron-700"
                  aria-label="Close gallery"
                >
                  <FontAwesomeIcon icon={faXmark} className="tw-w-5 tw-h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="tw-relative tw-z-[100] tw-p-6 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-max-h-[calc(90vh-120px)]">
                {isLoading ? (
                  <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                    <div className="tw-text-iron-400">Loading submissions...</div>
                  </div>
                ) : (
                  <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
                    {submissions.map((submission, index) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="tw-group tw-relative tw-cursor-pointer tw-flex tw-flex-col tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-ring-1 tw-px-0.5 tw-pt-0.5 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600/60  tw-transition-opacity tw-duration-500 tw-ease-out"
                      onClick={() => handleDropClick(submission.id)}
                    >
                      {/* Image container */}
                      <div className="tw-w-full tw-max-w-full tw-relative">
                        <div className="tw-h-[200px] min-[800px]:tw-h-[250px] min-[1200px]:tw-h-[18.75rem] tw-text-center tw-flex tw-items-center tw-justify-center">
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
                      <div className="tw-p-4">
                        {submission.title && (
                          <p className="tw-font-semibold tw-text-iron-100 tw-text-md tw-mb-2">
                            {submission.title}
                          </p>
                        )}
                        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500">
                          <CalendarDaysIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                          <span>{formatDate(submission.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
