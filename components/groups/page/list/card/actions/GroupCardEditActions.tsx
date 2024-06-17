import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AuthContext } from "../../../../../auth/Auth";
import { GroupFull } from "../../../../../../generated/models/GroupFull";
import { AnimatePresence, motion } from "framer-motion";
import GroupCardDelete from "./delete/GroupCardDelete";

export default function GroupCardEditActions({
  group,
  onEditClick,
}: {
  readonly group: GroupFull;
  readonly onEditClick: (group: GroupFull) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));

  const [isMyFilter, setIsMyFilter] = useState(
    connectedProfile?.profile?.handle.toLowerCase() ===
      group.created_by?.handle.toLowerCase()
  );

  useEffect(
    () =>
      setIsMyFilter(
        connectedProfile?.profile?.handle.toLowerCase() ===
          group.created_by?.handle.toLowerCase()
      ),
    [connectedProfile]
  );

  const getEditTitle = () => (isMyFilter ? "Edit" : "Clone");

  const [editTitle, setEditTitle] = useState<string>(getEditTitle());
  useEffect(() => setEditTitle(getEditTitle()), [isMyFilter]);

  return (
    <div className="tw-relative" ref={listRef}>
      <button
        type="button"
        className="tw-bg-transparent tw-h-full tw-border-0 tw-block tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
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
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-32 tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none"
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(group);
                }}
                className="tw-bg-transparent tw-w-full tw-border-none tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-iron-50 hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
                role="menuitem"
                tabIndex={-1}
                id="options-menu-0-item-0"
              >
                {editTitle}
              </button>
              {isMyFilter && <GroupCardDelete group={group} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
