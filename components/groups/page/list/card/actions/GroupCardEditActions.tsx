"use client";

import { useContext, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "@/components/auth/Auth";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { AnimatePresence, motion } from "framer-motion";
import GroupCardDelete from "./delete/GroupCardDelete";

export default function GroupCardEditActions({
  group,
  onEditClick,
}: {
  readonly group: ApiGroupFull;
  readonly onEditClick: (group: ApiGroupFull) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));

  const isMyFilter =
    connectedProfile?.handle?.toLowerCase() ===
    group.created_by?.handle?.toLowerCase();
  const editTitle = isMyFilter ? "Edit" : "Clone";

  return (
    <div className="tw-relative tw-z-40" ref={listRef}>
      <button
        type="button"
        className="tw-bg-transparent tw-h-full tw-border-0 tw-block tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
        id="options-menu-0-button"
        aria-expanded={isOptionsOpen}
        aria-haspopup="menu"
        aria-controls="options-menu-0"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen(!isOptionsOpen);
        }}>
        <span className="tw-sr-only">Open options</span>
        <FontAwesomeIcon
          icon={faEllipsisVertical}
          className="tw-h-5 tw-w-5"
          aria-hidden="true"
        />
      </button>
      <AnimatePresence mode="wait" initial={false}>
        {isOptionsOpen && (
          <motion.div
            id="options-menu-0"
            className="tw-absolute tw-right-0 tw-z-40 tw-mt-2 tw-w-32 tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu-0-button"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}>
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(group);
                }}
                className="tw-bg-transparent tw-w-full tw-border-none tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-iron-50 hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
                role="menuitem"
                id="options-menu-0-item-0">
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
