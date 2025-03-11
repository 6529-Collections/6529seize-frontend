import React, { useMemo, useState, useRef, useEffect } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import useCapacitor from "../../../hooks/useCapacitor";
import { WaveLeaderboardSortType } from "../../waves/leaderboard/WaveLeaderboard";
import { WaveLeaderboardTime } from "../../waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "../../waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "../../waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "../../waves/leaderboard/drops/WaveLeaderboardDrops";
import { useWave } from "../../../hooks/useWave";
import PrimaryButton from "../../utils/button/PrimaryButton";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface StyleTag {
  id: string;
  name: string;
  color: string;
}

const calculateHeight = (isCapacitor: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-18rem)]";
  }
  return `tw-h-[calc(100vh-9rem)] min-[1200px]:tw-h-[calc(100vh-9.5rem)] lg:tw-pr-2`;
};

// Pre-defined style tags that users can search for and select
const availableStyleTags: StyleTag[] = [
  { id: "abstract", name: "Abstract", color: "#FF5733" },
  { id: "pixel", name: "Pixel Art", color: "#33FF57" },
  { id: "3d", name: "3D Render", color: "#3357FF" },
  { id: "minimalist", name: "Minimalist", color: "#F033FF" },
  { id: "cyberpunk", name: "Cyberpunk", color: "#FF33A8" },
  { id: "surreal", name: "Surrealist", color: "#33FFF0" },
  { id: "pop", name: "Pop Art", color: "#FFD633" },
  { id: "glitch", name: "Glitch Art", color: "#A833FF" },
  { id: "vaporwave", name: "Vaporwave", color: "#FF33F6" },
  { id: "generative", name: "Generative", color: "#33FFBD" },
  { id: "illustration", name: "Illustration", color: "#FF9A33" },
  { id: "collage", name: "Collage", color: "#FF3333" },
  { id: "experimental", name: "Experimental", color: "#FFFF33" },
];

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const capacitor = useCapacitor();
  const { hasFirstDecisionPassed } = useWaveState(wave);
  const { isMemesWave } = useWave(wave);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const containerClassName = useMemo(() => {
    return `lg:tw-pt-2 tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden ${calculateHeight(
      capacitor.isCapacitor
    )}`;
  }, [capacitor.isCapacitor]);

  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );
  const [showMyDrops, setShowMyDrops] = useState(false);
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const [isSubmittingArt, setIsSubmittingArt] = useState(false);
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");
  const [selectedStyleTags, setSelectedStyleTags] = useState<StyleTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<StyleTag[]>([]);
  const [artworkDetails, setArtworkDetails] = useState({
    title: "",
    inspiration: "",
  });

  // Filter available tags based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = availableStyleTags.filter(
        (tag) => 
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedStyleTags.some(selectedTag => selectedTag.id === tag.id)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  }, [searchTerm, selectedStyleTags]);

  const sortBy: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortBy> = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortBy.RANK,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortBy.CREATION_TIME,
  };

  const sortDirection: Record<
    WaveLeaderboardSortType,
    WaveDropsLeaderboardSortDirection
  > = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortDirection.DESC,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortDirection.ASC,
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setArtworkUrl(reader.result as string);
      setArtworkUploaded(true);
    };
    reader.readAsDataURL(file);
  };

  const addStyleTag = (tag: StyleTag) => {
    if (!selectedStyleTags.some(selectedTag => selectedTag.id === tag.id)) {
      setSelectedStyleTags([...selectedStyleTags, tag]);
      setSearchTerm("");
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const removeStyleTag = (tagId: string) => {
    setSelectedStyleTags(selectedStyleTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className={containerClassName}>
      {/* Time section is always visible */}
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <WaveLeaderboardTime wave={wave} />

        {/* Header and Winners banner only shown when not in art submission mode */}
        {!(isMemesWave && isSubmittingArt) && (
          <>
            <WaveLeaderboardHeader
              wave={wave}
              sort={sort}
              setSort={setSort}
              showMyDrops={showMyDrops}
              setShowMyDrops={setShowMyDrops}
              onCreateDrop={() => {
                if (isMemesWave) {
                  setIsSubmittingArt(true);
                } else {
                  setIsCreatingDrop(true);
                }
              }}
            />

            {hasFirstDecisionPassed && (
              <div className="tw-mt-2 tw-mb-4 tw-bg-primary-400/20 tw-px-4 tw-py-3 tw-rounded-lg tw-border tw-border-primary-500/20">
                <div className="tw-flex tw-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="tw-size-5 tw-text-primary-300 tw-mr-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="tw-mb-0 tw-text-sm tw-text-primary-300">
                    <strong>Winners announced!</strong>{" "}
                    <span className="tw-text-iron-200">
                      Check the Winners tab to see the results.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Regular flow for expanding drop creation for non-Memes waves */}
      {!(isMemesWave && isSubmittingArt) && (
        <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <AnimatePresence>
            {isCreatingDrop && !isMemesWave && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <WaveDropCreate
                  wave={wave!}
                  onCancel={() => setIsCreatingDrop(false)}
                  onSuccess={() => {
                    setIsCreatingDrop(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regular leaderboard drops (only shown when not in art submission mode) */}
          <WaveLeaderboardDrops
            wave={wave}
            dropsSortBy={sortBy[sort]}
            sortDirection={sortDirection[sort]}
            showMyDrops={showMyDrops}
            onCreateDrop={() => {
              if (isMemesWave) {
                setIsSubmittingArt(true);
              } else {
                setIsCreatingDrop(true);
              }
            }}
          />
        </div>
      )}

      {/* Art submission takes full area when active in Memes wave */}
      {isMemesWave && isSubmittingArt && (
        <div className="tw-mt-4 tw-pb-4 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="tw-w-full tw-bg-gradient-to-b tw-from-iron-950 tw-to-iron-900 tw-rounded-2xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur"
          >
            {/* Ambient background effect */}
            <div className="tw-absolute tw-inset-0 tw-rounded-2xl tw-overflow-hidden">
              <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/5 tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
              <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/5 tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
            </div>

            {/* Cancel button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsSubmittingArt(false)}
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
                Submit Your Art
              </motion.h3>

              <div className="tw-grid lg:tw-grid-cols-[1.2fr_1fr] tw-gap-8">
                {/* Left Column - Interactive Upload Area */}
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className="tw-relative tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950 tw-rounded-xl tw-overflow-hidden tw-aspect-[4/3] tw-group"
                >
                  {!artworkUploaded ? (
                    <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6">
                      {/* Abstract art-themed upload indicator */}
                      <div className="tw-relative tw-mb-6">
                        <div className="tw-w-32 tw-h-32 tw-relative">
                          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-primary-500/20 tw-to-transparent tw-rounded-full tw-animate-pulse" />
                          <div
                            className="tw-absolute tw-inset-0 tw-border-2 tw-border-dashed tw-border-iron-700 tw-rounded-full tw-animate-spin"
                            style={{ animationDuration: "10s" }}
                          />
                          <div className="tw-absolute tw-inset-4 tw-border tw-border-iron-600 tw-rounded-full" />
                          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
                            <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
                              Select Art
                            </span>
                          </div>
                        </div>
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
                            GIF
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
                <div className="tw-space-y-6">
                  {/* Title Field - artistic journal style */}
                  <div className="tw-space-y-2">
                    <label className="tw-text-sm tw-text-iron-200 tw-font-medium tw-tracking-wide tw-uppercase">
                      Title
                    </label>
                    <div className="tw-relative tw-mt-1">
                      <div className="tw-absolute tw-inset-0 tw-bg-iron-800/20 tw-rounded-xl tw-transform tw-rotate-0.5"></div>
                      <input
                        type="text"
                        maxLength={50}
                        className="tw-w-full tw-bg-iron-900 tw-border tw-border-iron-700 tw-rounded-lg tw-px-4 tw-py-4 tw-relative tw-z-10 tw-font-medium tw-tracking-wide tw-text-iron-100 tw-outline-none focus:tw-border-primary-500 tw-transition-all tw-duration-300 tw-shadow-inner tw-shadow-iron-950/50"
                        placeholder="what do you call this creation?"
                        value={artworkDetails.title}
                        onChange={(e) => setArtworkDetails({...artworkDetails, title: e.target.value})}
                        style={{ fontFamily: "monospace" }}
                      />
                    </div>
                  </div>

                  {/* Style Tags - Creative tag selection */}
                  <div className="tw-space-y-2 tw-mt-5">
                    <label className="tw-text-sm tw-text-iron-200 tw-font-medium tw-tracking-wide tw-uppercase">
                      Art Style
                    </label>
                    <div className="tw-relative tw-mt-1">
                      <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-p-3 tw-bg-iron-900 tw-border tw-border-iron-700 tw-rounded-lg focus-within:tw-border-primary-500 tw-transition-all tw-min-h-[4rem] tw-shadow-inner tw-shadow-iron-950/50">
                        {/* Selected tags */}
                        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mr-2 tw-w-full">
                          {selectedStyleTags.map((tag) => (
                            <motion.div
                              key={tag.id}
                              initial={{ rotate: -5, scale: 0, opacity: 0 }}
                              animate={{ rotate: Math.random() * 6 - 3, scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              whileHover={{ scale: 1.05, rotate: 0 }}
                              className="tw-relative tw-px-3 tw-py-1.5 tw-rounded-md tw-shadow-md tw-overflow-hidden"
                              style={{ backgroundColor: tag.color }}
                            >
                              {/* Texture overlay */}
                              <div className="tw-absolute tw-inset-0 tw-bg-iron-900 tw-opacity-60 tw-mix-blend-overlay"></div>
                              
                              <span className="tw-text-sm tw-font-bold tw-tracking-wide tw-z-10 tw-relative tw-text-white">
                                {tag.name}
                              </span>
                              <button
                                onClick={() => removeStyleTag(tag.id)}
                                className="tw-ml-2 tw-rounded-full tw-inline-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-bg-white/20 hover:tw-bg-white/40 tw-transition-colors tw-z-10 tw-relative"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="tw-w-3 tw-h-3 tw-text-white"
                                >
                                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                              </button>
                            </motion.div>
                          ))}
                          
                          {/* Search field with creative placeholder */}
                          <div className="tw-relative tw-flex-1 tw-min-w-[150px]">
                            <div className="tw-absolute tw-pointer-events-none tw-h-full tw-flex tw-items-center tw-pl-1 tw-text-iron-500" style={{ display: searchTerm ? 'none' : 'flex' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="tw-h-4 tw-w-4 tw-mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <span className="tw-italic tw-text-iron-500 tw-text-sm">
                                {selectedStyleTags.length ? "add more styles..." : "abstract, pixel art, surrealist..."}
                              </span>
                            </div>
                            <input
                              ref={searchInputRef}
                              type="text"
                              className="tw-w-full tw-bg-transparent tw-border-none tw-text-iron-200 tw-py-2 tw-outline-none focus:tw-ring-0 tw-text-base"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Tag suggestions */}
                      <AnimatePresence>
                        {showTagSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="tw-absolute tw-z-20 tw-left-0 tw-right-0 tw-mt-1 tw-bg-iron-900 tw-border tw-border-iron-700 tw-rounded-lg tw-shadow-lg tw-max-h-60 tw-overflow-y-auto"
                          >
                            <div className="tw-p-2 tw-flex tw-flex-wrap tw-gap-2">
                              {filteredTags.map((tag) => (
                                <motion.div
                                  key={tag.id}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => addStyleTag(tag)}
                                  className="tw-cursor-pointer tw-flex tw-items-center tw-px-3 tw-py-1.5 tw-rounded-md tw-inline-flex"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  <span className="tw-text-white tw-text-sm">{tag.name}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Description Field - artistic sketchbook style */}
                  <div className="tw-space-y-2 tw-mt-5">
                    <label className="tw-text-sm tw-text-iron-200 tw-font-medium tw-tracking-wide tw-uppercase">
                      The Story Behind It
                    </label>
                    <div className="tw-relative">
                      <div className="tw-absolute tw-inset-0 tw-bg-iron-800/20 tw-rounded-xl tw-transform tw-rotate-0.5"></div>
                      <div className="tw-absolute tw-inset-0 tw-border-l-4 tw-border-primary-500/30 tw-rounded-xl tw-transform -tw-rotate-0.5"></div>
                      <textarea
                        className="tw-w-full tw-min-h-[120px] tw-bg-iron-900 tw-border tw-border-iron-700 tw-rounded-lg tw-px-4 tw-py-4 tw-outline-none tw-transition-all tw-duration-300 focus:tw-border-primary-500 tw-resize-none tw-relative tw-z-10 tw-shadow-inner tw-shadow-iron-950/50"
                        placeholder="share the inspiration and story behind your creation..."
                        value={artworkDetails.inspiration}
                        onChange={(e) => setArtworkDetails({...artworkDetails, inspiration: e.target.value})}
                        style={{ fontFamily: "monospace" }}
                      />
                      {/* Sketchy line decorations */}
                      <div className="tw-absolute tw-left-4 tw-right-8 tw-h-[1px] tw-bg-iron-700/30 tw-top-1/3 tw-z-20 tw-pointer-events-none"></div>
                      <div className="tw-absolute tw-left-6 tw-right-4 tw-h-[1px] tw-bg-iron-700/30 tw-top-2/3 tw-z-20 tw-pointer-events-none"></div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="tw-flex tw-justify-end tw-mt-4">
                      <PrimaryButton
                        onClicked={() => {/* handle submit */}}
                        loading={false}
                        disabled={false}
                        padding="tw-py-3 tw-px-8"
                      >
                        Submit Artwork
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveLeaderboard;
