import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../../../auth/Auth";
import {
  ImageScale,
  getScaledImageUri,
} from "../../../../helpers/image.helpers";
import Link from "next/link";

import GroupItemDelete from "./delete/GroupItemDelete";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import GroupBuildStatementsList from "../../build/statements/GroupBuildStatementsList";
import GroupItemWrapper from "./GroupItemWrapper";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveGroupId,
  setActiveGroupId,
} from "../../../../store/groupSlice";
import { GroupFull } from "../../../../generated/models/GroupFull";

export default function GroupItem({
  group,
  onEditClick,
}: {
  readonly group: GroupFull;
  readonly onEditClick: (filter: GroupFull) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();
  const getIsActive = (): boolean =>
    !!activeGroupId && activeGroupId === group.id;

  const [isActive, setIsActive] = useState(getIsActive());

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeGroupId]);

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

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));

  const deActivate = () => {
    if (!isActive) return;
    dispatch(setActiveGroupId(null));
  };

  const [deactivateHover, setDeactivateHover] = useState(false);

  return (
    <GroupItemWrapper
      filter={group}
      isActive={isActive}
      deactivateHover={deactivateHover}
    >
      <div className="tw-px-4 tw-py-2.5 tw-relative">
        {isActive && (
          <div className="tw-absolute -tw-right-2 -tw-top-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deActivate();
              }}
              onMouseEnter={() => setDeactivateHover(true)}
              onMouseLeave={() => setDeactivateHover(false)}
              type="button"
              className="tw-group tw-p-1.5 tw-bg-iron-800 tw-border-0 tw-flex tw-items-center tw-justify-center tw-rounded-full"
            >
              <span className="tw-sr-only">Remove</span>
              <svg
                className="tw-h-4 tw-w-4 tw-text-iron-400 group-hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        )}
        <div className="tw-flex tw-items-center tw-w-full tw-justify-between">
          <p className="tw-text-sm tw-font-normal tw-mb-0 tw-truncate">
            <span className="tw-text-iron-400 tw-pr-1.5">Name:</span>
            <span className="tw-text-iron-50 tw-font-medium">{group.name}</span>
          </p>
          {connectedProfile && (
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
                    className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-32 tw-origin-top-right tw-rounded-md tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/5 tw-focus:tw-outline-none"
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
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(group);
                        }}
                        className="tw-cursor-pointer tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
                        role="menuitem"
                        tabIndex={-1}
                        id="options-menu-0-item-0"
                      >
                        {editTitle}
                      </div>
                      {isMyFilter && <GroupItemDelete groupId={group.id} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        <div className="tw-pt-2">
          <GroupBuildStatementsList groupDescription={group.group} />
        </div>
      </div>

      <div className="tw-w-full tw-inline-flex tw-px-4 tw-py-2 tw-gap-x-2 tw-items-center">
        <p className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400 tw-mb-0">
          Created by
        </p>
        <div className="tw-flex tw-gap-x-2 tw-items-center">
          {group.created_by?.pfp && (
            <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
              <div className="tw-h-full tw-w-full tw-max-w-full">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                  <img
                    src={getScaledImageUri(
                      group.created_by.pfp,
                      ImageScale.W_AUTO_H_50
                    )}
                    alt="Community Table Profile Picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                </div>
              </div>
            </div>
          )}
          <div
            className="tw-flex tw-items-center tw-space-x-2"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Link
              href={`/${group.created_by?.handle}`}
              className="tw-no-underline hover:tw-underline tw-group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-text-iron-50 tw-text-sm tw-font-medium"
            >
              {group.created_by?.handle}
            </Link>
          </div>
        </div>
        {!group.visible && (
          <div className="tw-text-xs tw-w-full tw-text-right tw-text-red">
            Not saved
          </div>
        )}
      </div>
    </GroupItemWrapper>
  );
}
