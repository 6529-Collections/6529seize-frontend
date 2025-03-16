import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "../../utils/button/PrimaryButton";

interface StyleTag {
  id: string;
  name: string;
  color: string;
}

interface ArtworkDetails {
  title: string;
  inspiration: string;
}

interface MemesArtSubmissionProps {
  readonly onCancel: () => void;
  readonly onSubmit: (artwork: {
    title: string;
    inspiration: string;
    imageUrl: string;
    tags: StyleTag[];
  }) => void;
}

// Pre-defined style tags that users can search for and select
const availableStyleTags: StyleTag[] = [
  { id: "3d", name: "No", color: "#6366f1" },
  { id: "artist", name: "Oveck", color: "#4f46e5" },
  { id: "bonus", name: "Airdrops", color: "#8b5cf6" },
  { id: "boost", name: "None", color: "#7c3aed" },
  { id: "clothing", name: "GM Skin", color: "#ec4899" },
  { id: "collab", name: "Yes", color: "#d946ef" },
  { id: "dharma", name: "Samanyadharma", color: "#f43f5e" },
  { id: "drink", name: "Orange Wine", color: "#10b981" },
  { id: "dynamic", name: "No", color: "#0ea5e9" },
  { id: "element", name: "Oxigen", color: "#6366f1" },
  { id: "food", name: "Mgic...", color: "#8b5cf6" },
  { id: "gear", name: "Brush", color: "#ec4899" },
  { id: "gm", name: "Yes", color: "#f43f5e" },
  { id: "gradient", name: "No", color: "#6366f1" },
  { id: "home", name: "Melancholia", color: "#4f46e5" },
  { id: "interactive", name: "No", color: "#8b5cf6" },
  { id: "issuance_month", name: "2023/01", color: "#7c3aed" },
  { id: "jewel", name: "Quartz", color: "#ec4899" },
];

const MemesArtSubmission: React.FC<MemesArtSubmissionProps> = ({
  onCancel,
  onSubmit,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");
  const [selectedStyleTags, setSelectedStyleTags] = useState<StyleTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<StyleTag[]>([]);
  const [artworkDetails, setArtworkDetails] = useState<ArtworkDetails>({
    title: "",
    inspiration: "",
  });

  // Filter available tags based on search term
  React.useEffect(() => {
    if (searchTerm) {
      const filtered = availableStyleTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedStyleTags.some((selectedTag) => selectedTag.id === tag.id)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  }, [searchTerm, selectedStyleTags]);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setArtworkUrl(reader.result as string);
      setArtworkUploaded(true);
    };
    reader.readAsDataURL(file);
  };

  const addStyleTag = (tag: StyleTag) => {
    if (!selectedStyleTags.some((selectedTag) => selectedTag.id === tag.id)) {
      setSelectedStyleTags([...selectedStyleTags, tag]);
      setSearchTerm("");
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const removeStyleTag = (tagId: string) => {
    setSelectedStyleTags(selectedStyleTags.filter((tag) => tag.id !== tagId));
  };

  const handleSubmit = () => {
    onSubmit({
      title: artworkDetails.title,
      inspiration: artworkDetails.inspiration,
      imageUrl: artworkUrl,
      tags: selectedStyleTags,
    });
  };

  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="tw-w-full tw-bg-gradient-to-b tw-from-iron-950 tw-via-iron-950/95 tw-to-iron-900/90 tw-rounded-2xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur"
      >
        {/* Ambient background effect */}
        <div className="tw-absolute tw-inset-0 tw-rounded-2xl tw-overflow-hidden">
          <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/4 tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
          <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/3 tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
          <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/4 tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
        </div>

        {/* Cancel button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={onCancel}
          className="tw-absolute tw-bg-transparent tw-border-0 tw-right-6 tw-top-6 tw-z-20 tw-text-iron-400 tw-text-sm tw-font-medium hover:tw-text-iron-100 tw-transition-colors"
        >
          Cancel
        </motion.button>

        <div className="tw-relative tw-z-10">
          {/* Modern Header */}
          <motion.h3
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw-text-2xl tw-font-medium tw-text-iron-100 tw-mb-4"
          >
            Submit Artwork
          </motion.h3>

          {/* Grid container - remove h-full since we want natural height */}
          <div className="tw-grid lg:tw-grid-cols-[1.2fr_1fr] tw-gap-8">
            {/* Left Column - remove h-full and aspect ratio, use fixed height */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="tw-relative tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950 tw-rounded-xl tw-overflow-hidden tw-group tw-cursor-pointer hover:tw-border hover:tw-border-iron-700/80 tw-transition-all tw-duration-300"
            >
              {!artworkUploaded ? (
                <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6">
                  {/* Subtle animated dashed border around entire area */}
                  <div className="tw-absolute tw-inset-[10px] tw-border-2 tw-border-dashed tw-border-iron-700/40 group-hover:tw-border-primary-500/30 tw-rounded-lg tw-transition-all tw-duration-300" />
                  <div className="tw-absolute tw-inset-[10px] tw-border tw-border-dashed tw-border-iron-600/20 group-hover:tw-border-iron-500/30 tw-rounded-lg tw-animate-pulse tw-transition-all tw-duration-300" />

                  {/* Pattern background suggesting droppable area */}
                  <div className="tw-absolute tw-inset-0 tw-pointer-events-none tw-opacity-5">
                    <div className="tw-grid tw-grid-cols-8 tw-h-full">
                      {Array(32)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="tw-border-[0.5px] tw-border-iron-400/40"
                          />
                        ))}
                    </div>
                  </div>

                  {/* Abstract art-themed upload indicator */}
                  <div className="tw-relative tw-mb-2">
                    <div className="tw-w-32 tw-h-32 tw-relative">
                      <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-primary-500/20 tw-to-transparent tw-rounded-full tw-animate-pulse" />
                      <div
                        className="tw-absolute tw-inset-0 tw-border-2 tw-border-dashed tw-border-iron-700 tw-rounded-full tw-animate-spin"
                        style={{ animationDuration: "10s" }}
                      />
                      <div className="tw-absolute tw-inset-4 tw-border tw-border-iron-600 tw-rounded-full" />
                      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
                        <span className="tw-text-iron-400 tw-text-sm tw-font-medium group-hover:tw-text-primary-300 tw-transition-colors tw-duration-300">
                          Select Art
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drag and drop text hint */}
                  <div className="tw-flex tw-items-center tw-justify-center tw-mb-8 tw-transition-all tw-duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="tw-w-4 tw-h-4 tw-mr-1.5 tw-text-iron-500 group-hover:tw-text-primary-400 tw-transition-colors tw-duration-300"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="tw-text-iron-500 tw-text-xs group-hover:tw-text-iron-300 tw-transition-colors tw-duration-300">
                      Drag and drop file here
                    </span>
                  </div>

                  {/* File type indicators */}
                  <div className="tw-absolute tw-bottom-6 tw-left-6 tw-right-6">
                    <div className="tw-flex tw-justify-center tw-gap-3 tw-text-xs tw-text-iron-500">
                      <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                        PNG
                      </span>
                      <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                        JPG
                      </span>
                      <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                        VIDEO
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="tw-relative tw-w-full tw-h-full"
                >
                  <img
                    src={artworkUrl}
                    alt="Preview"
                    className="tw-w-full tw-h-full tw-object-cover"
                  />
                  <button
                    onClick={() => setArtworkUploaded(false)}
                    className="tw-absolute tw-top-4 tw-right-4 tw-p-2 tw-rounded-lg tw-bg-iron-900/80 tw-backdrop-blur hover:tw-bg-iron-800/80"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="tw-w-5 tw-h-5 tw-text-iron-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column - Creative Input Fields */}
            <div className="tw-flex tw-flex-col">
              <div className="tw-space-y-6 tw-flex-1">
                {/* Name Field */}
                <div className="tw-relative tw-group">
                  <label className="tw-text-xs tw-text-iron-300 tw-mb-2 tw-block">
                    Title
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-h-12 tw-pl-4 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out"
                    placeholder="Name your creation"
                    value={artworkDetails.title}
                    onChange={(e) =>
                      setArtworkDetails({
                        ...artworkDetails,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Traits Tags */}
                <div className="tw-relative tw-group">
                  <label className="tw-text-xs tw-text-iron-300 tw-mb-2 tw-block">
                    Add traits
                  </label>
                  <div className="tw-form-input tw-relative tw-block tw-w-full tw-rounded-lg tw-border-0 tw-pl-4 tw-pr-3 tw-py-2 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 tw-transition-all tw-duration-300 tw-ease-out tw-overflow-hidden">
                    {/* Subtle hover effect */}
                    <div className="tw-absolute tw-inset-0 tw-bg-iron-700 tw-opacity-0 group-hover:tw-opacity-10 tw-transition-opacity tw-duration-300"></div>

                    {/* Selected Tags */}
                    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mr-2 tw-w-full tw-min-h-[32px]">
                      {selectedStyleTags.map((tag) => (
                        <motion.div
                          key={tag.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                          }}
                          className="tw-relative tw-rounded-lg tw-px-3 tw-py-1 tw-shadow-sm tw-overflow-hidden tw-cursor-pointer tw-border tw-border-iron-700/50"
                          style={{ backgroundColor: `${tag.color}20` }} // 12% opacity for subtlety
                        >
                          {/* Subtle texture overlay */}
                          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-800/30 tw-to-transparent tw-mix-blend-overlay"></div>
                          <div className="tw-absolute tw-inset-0 tw-border-t tw-border-l tw-border-white/5"></div>
                          <span className="tw-text-xs tw-font-medium tw-z-10 tw-relative tw-text-iron-50 tw-whitespace-normal tw-break-normal">
                            {tag.id}:{tag.name}
                          </span>
                          <button
                            onClick={() => removeStyleTag(tag.id)}
                            className="tw-ml-2 tw-rounded-full tw-inline-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-bg-iron-800/70 hover:tw-bg-primary-500/80 tw-transition-all tw-duration-200 tw-z-10 tw-relative tw-border tw-border-iron-700/50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="tw-size-3 tw-flex-shrink-0 tw-text-iron-50"
                            >
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}

                      {/* Search Input */}
                      <div className="tw-relative tw-flex-1 tw-min-w-[120px]">
                        <div
                          className="tw-absolute tw-pointer-events-none tw-h-full tw-flex tw-items-center tw-text-iron-500 tw-transition-opacity tw-duration-300"
                          style={{ display: searchTerm ? "none" : "flex" }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="tw-size-4 tw-mr-2 tw-text-iron-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="tw-w-full tw-bg-transparent tw-border-none tw-py-1.5 tw-pl-6 tw-text-iron-200 tw-font-normal tw-outline-none focus:tw-ring-0 tw-text-sm tw-placeholder-iron-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Add traits to your artwork"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tag suggestions dropdown */}
                  <AnimatePresence>
                    {showTagSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="tw-absolute tw-z-20 tw-w-full tw-mt-2 tw-bg-iron-900 tw-border tw-border-iron-800/40 tw-rounded-lg tw-shadow-lg tw-py-2 tw-px-2"
                      >
                        <div className="tw-max-h-48 tw-overflow-y-auto">
                          <div className="tw-flex tw-flex-col tw-gap-1.5">
                            {filteredTags.map((tag) => (
                              <div
                                key={tag.id}
                                onClick={() => addStyleTag(tag)}
                                className="tw-relative tw-rounded-lg tw-px-3 tw-py-2 tw-shadow-sm tw-overflow-hidden tw-cursor-pointer tw-border tw-border-iron-700/50 hover:tw-border-iron-600/70 tw-transition-all tw-duration-200"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                }}
                              >
                                <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-800/30 tw-to-transparent tw-mix-blend-overlay"></div>
                                <div className="tw-absolute tw-inset-0 tw-border-t tw-border-l tw-border-white/5"></div>
                                <span className="tw-text-xs tw-font-medium tw-z-10 tw-relative tw-text-iron-50 tw-whitespace-normal tw-break-normal">
                                  {tag.id} : {tag.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Description Field */}
                <div className="tw-relative tw-group">
                  <label className="tw-text-xs tw-text-iron-300 tw-mb-2 tw-block">
                    Description
                  </label>
                  <textarea
                    className="tw-form-input tw-block tw-w-full tw-min-h-[90px] tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-4 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out tw-resize-none"
                    placeholder="Share the story behind your artwork"
                    value={artworkDetails.inspiration}
                    onChange={(e) =>
                      setArtworkDetails({
                        ...artworkDetails,
                        inspiration: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="tw-w-full tw-mt-6">
                <PrimaryButton
                  onClicked={handleSubmit}
                  loading={false}
                  disabled={!artworkUploaded || !artworkDetails.title}
                >
                  Enter the Contest
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MemesArtSubmission;