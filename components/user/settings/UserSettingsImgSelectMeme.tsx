"use client";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";

export interface NFTLite {
  animation: string | null;
  contract: string;
  icon: string | null;
  id: 1;
  image: string | null;
  name: string | null;
  scaled: string | null;
  thumbnail: string | null;
  artist: string | null;
}

export default function UserSettingsImgSelectMeme({
  memes,
  onMeme,
}: {
  readonly memes: NFTLite[];
  readonly onMeme: (meme: NFTLite) => void;
}) {
  const [input, setInput] = useState<string>("");

  const filteredMemes = useMemo(() => {
    if (!input) {
      return memes;
    }
    return memes.filter((meme) =>
      `#${meme.id} ${meme.name ?? ""}`
        .toLowerCase()
        .includes(input.toLowerCase())
    );
  }, [input, memes]);

  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));

  const setMemeAndCloseDropdown = (meme: NFTLite) => {
    onMeme(meme);
    setIsOpen(false);
  };
  return (
    <div ref={listRef} className="tw-relative tw-max-w-full">
      <label
        htmlFor="search-meme"
        className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200"
      >
        Select Meme
      </label>
      <div className="tw-group tw-relative tw-mt-2">
        <input
          id="search-meme"
          type="text"
          name="search-meme"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          aria-controls="meme-search-results"
          autoComplete="off"
          placeholder="Search"
          className="tw-block tw-w-full tw-appearance-none tw-rounded-xl tw-border-0 tw-bg-iron-900/70 tw-py-3 tw-pl-11 tw-pr-4 tw-text-left tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-white/15 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400/60 sm:tw-leading-6"
        />
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-3.5 tw-flex tw-items-center">
          <svg
            className="tw-h-5 tw-w-5 tw-text-iron-400 tw-transition-colors tw-duration-200 group-focus-within:tw-text-primary-300"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <m.div
              className="tw-absolute tw-right-0 tw-z-30 tw-mt-2 tw-w-full tw-origin-top-right tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/50"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}>
              <div className="tw-flow-root tw-max-h-[calc(20rem+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto tw-p-1.5">
                <ul
                  id="meme-search-results"
                  className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0"
                >
                  {filteredMemes.map((meme) => {
                    const imageUrl =
                      meme.thumbnail ?? meme.image ?? meme.scaled;

                    return (
                      <li key={meme.id}>
                        <button
                          type="button"
                          onClick={() => setMemeAndCloseDropdown(meme)}
                          className="tw-flex tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-2 tw-text-left tw-text-iron-50 tw-transition-colors tw-duration-150 focus:tw-outline-none focus-visible:tw-bg-iron-800 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-bg-iron-800"
                        >
                          <span className="tw-relative tw-size-7 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
                            {imageUrl && (
                              <Image
                                src={imageUrl}
                                alt=""
                                fill
                                sizes="28px"
                                unoptimized
                                className="tw-object-cover"
                              />
                            )}
                          </span>
                          <span className="tw-ml-2.5 tw-inline-block tw-text-sm tw-font-medium tw-text-iron-100">
                            {`#${meme.id} ${meme.name ?? ""}`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
