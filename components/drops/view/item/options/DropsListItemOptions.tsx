import { useContext, useEffect, useRef, useState } from "react";
import { Drop } from "../../../../../generated/models/Drop";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import DropsListItemFollowDrop from "./follow/DropsListItemFollowDrop";
import { AuthContext } from "../../../../auth/Auth";
import DropsListItemDeleteDrop from "./delete/DropsListItemDeleteDrop";

export default function DropsListItemOptions({
  drop,
  onDropDeleted,
}: {
  readonly drop: Drop;
  readonly onDropDeleted?: () => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));

  const getIsAuthor = () =>
    connectedProfile?.profile?.handle === drop.author.handle;

  const [isAuthor, setIsAuthor] = useState(getIsAuthor());
  useEffect(() => {
    setIsAuthor(getIsAuthor());
  }, [connectedProfile]);

  return (
    <div className="tw-relative tw-z-20" ref={listRef}>
      <button
        type="button"
        className="tw-bg-transparent tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-800 tw-rounded-full tw-h-8 tw-w-8 tw-border-0 tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
        id="options-menu-0-button"
        aria-expanded="false"
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen(!isOptionsOpen);
        }}
      >
        <span className="tw-sr-only">Open options</span>
        <svg
          className="tw-h-5 tw-w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>
      <AnimatePresence mode="wait" initial={false}>
        {isOptionsOpen && (
          <motion.div
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-40 tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu-0-button"
            tabIndex={-1}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              {isAuthor ? (
                <DropsListItemDeleteDrop
                  drop={drop}
                  onDropDeleted={onDropDeleted}
                />
              ) : (
                <DropsListItemFollowDrop
                  drop={drop}
                  closeOptions={() => setIsOptionsOpen(false)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
