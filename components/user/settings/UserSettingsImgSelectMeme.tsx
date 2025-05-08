import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway } from "react-use";

export interface MemeLite {
  animation: any;
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
  readonly memes: MemeLite[];
  readonly onMeme: (meme: MemeLite) => void;
}) {
  const [input, setInput] = useState<string>("");

  const [filteredMemes, setFilteredMemes] = useState<MemeLite[]>(memes);

  useEffect(() => {
    if (!input) {
      setFilteredMemes(memes);
      return;
    }
    setFilteredMemes(
      memes.filter((meme) =>
        `#${meme.id} ${meme.name}`.toLowerCase().includes(input.toLowerCase())
      )
    );
  }, [input, memes]);

  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));

  const setMemeAndCloseDropdown = (meme: MemeLite) => {
    onMeme(meme);
    setIsOpen(false);
  };
  return (
    <div ref={listRef} className="tw-max-w-full tw-relative">
      <label
        htmlFor="search-meme"
        className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300">
        Select Meme
      </label>
      <div className="tw-mt-2 tw-relative">
        <input
          type="text"
          name="search-meme"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search"
          className="tw-appearance-none tw-text-left tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-iron-900 focus:tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-600 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-left-3">
          <svg
            className="tw-h-5 tw-w-5 tw-text-iron-50"
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
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}>
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-full tw-w-full tw-rounded-md tw-bg-iron-900 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-max-h-[calc(20rem+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {filteredMemes.map((meme) => (
                    <li
                      onClick={() => setMemeAndCloseDropdown(meme)}
                      key={meme.id}
                      className="tw-group tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out">
                      <img
                        src={meme.thumbnail ?? meme.image ?? meme.scaled ?? ""}
                        alt=""
                        className="tw-flex-shrink-0 tw-ml-0 tw-pl-0 tw-rounded-full tw-bg-iron-700 tw-h-6 tw-w-6"
                      />
                      <span className="tw-inline-block tw-ml-2 tw-text-sm tw-font-medium tw-text-iron-50">
                        {`#${meme.id} ${meme.name ?? ""}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
